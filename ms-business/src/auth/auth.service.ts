import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Persona, TipoDocumento } from '../persona/entities/persona.entity';
import { Ciudadano } from '../ciudadano/entities/ciudadano.entity';
import { Conductor } from '../conductor/entities/conductor.entity';
import { MetodoPagoCiudadano } from '../metodo-pago-ciudadano/entities/metodo-pago-ciudadano.entity';
import { MetodoPago, MetodoPagoTipo } from '../metodo-pago/entities/metodo-pago.entity';
import { Asesor } from '../asesor/entities/asesor.entity';

@Injectable()
export class AuthService {
  constructor(private dataSource: DataSource) { }

  /**
   * Descompone el campo `name` del JWT en firstName y lastName.
   * Si el JWT trae "Juan García" en name, el primer token es nombre y el resto apellido.
   * Nunca guarda "Usuario"/"Pendiente" como placeholders.
   */
  private splitName(jwtPayload: any): { firstName: string; lastName: string } {
    if (jwtPayload.firstName || jwtPayload.first_name) {
      return {
        firstName: (jwtPayload.firstName || jwtPayload.first_name || '').trim() || 'Sin nombre',
        lastName: (jwtPayload.lastName || jwtPayload.last_name || '').trim() || 'Sin apellido',
      };
    }

    const lastName = (jwtPayload.lastName || jwtPayload.last_name || '').trim();
    const fullName = (jwtPayload.name || '').trim();

    if (fullName && lastName) {
      return { firstName: fullName, lastName };
    }

    if (fullName) {
      const parts = fullName.split(' ').filter(Boolean);
      if (parts.length === 1) return { firstName: parts[0], lastName: 'Sin apellido' };
      const midpoint = Math.ceil(parts.length / 2);
      return {
        firstName: parts.slice(0, midpoint).join(' '),
        lastName: parts.slice(midpoint).join(' '),
      };
    }

    const emailPart = (jwtPayload.email || '').split('@')[0] || 'usuario';
    return { firstName: emailPart, lastName: 'Pendiente' };
  }

  async syncUser(jwtPayload: any): Promise<any> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let persona = await queryRunner.manager.findOne(Persona, {
        where: { authId: jwtPayload.authId },
        lock: { mode: 'pessimistic_write' },
        relations: ['ciudadano', 'conductor', 'asesor']
      });

      if (!persona) {
        const { firstName, lastName } = this.splitName(jwtPayload);

        persona = queryRunner.manager.create(Persona, {
          authId: jwtPayload.authId,
          email: jwtPayload.email,
          firstName,
          lastName,
          tipoDocumento: TipoDocumento.CC,
          numeroDocumento: `PEND-${jwtPayload.authId.slice(-8)}`,
        });

        persona = await queryRunner.manager.save(persona);

        const isCitizen = !jwtPayload.roles || jwtPayload.roles.length === 0 || jwtPayload.roles.some(
          (r: any) => typeof r === 'string' && (
            r.toUpperCase().includes('CITIZEN') ||
            r.toUpperCase().includes('CIUDADANO') ||
            r.toUpperCase().includes('USER')
          )
        );


        if (isCitizen) {
          const ciudadano = queryRunner.manager.create(Ciudadano, { persona });
          const savedCiudadano = await queryRunner.manager.save(ciudadano);
          persona.ciudadano = savedCiudadano;

          let metodoPago = await queryRunner.manager.findOne(MetodoPago, {
            where: { tipo: MetodoPagoTipo.TARJETA }
          });

          if (!metodoPago) {
            metodoPago = queryRunner.manager.create(MetodoPago, {
              tipo: MetodoPagoTipo.TARJETA,
              descripcion: 'Tarjeta Virtual TuLlave / Metro (Por defecto)'
            });
            metodoPago = await queryRunner.manager.save(metodoPago);
          }

          const billetera = queryRunner.manager.create(MetodoPagoCiudadano, {
            ciudadano: savedCiudadano,
            metodoPago: metodoPago,
            saldo: 20000
          });
          await queryRunner.manager.save(billetera);
        }

      } else {
        // Actualizar email si cambió
        if (jwtPayload.email && persona.email !== jwtPayload.email) {
          persona.email = jwtPayload.email;
          persona = await queryRunner.manager.save(persona);
        }

        // Actualizar nombre si aún tiene los placeholders viejos
        if (
          persona.firstName === 'Usuario' || persona.firstName === 'Sin nombre' ||
          persona.lastName === 'Pendiente' || persona.lastName === 'Sin apellido'
        ) {
          const { firstName, lastName } = this.splitName(jwtPayload);
          if (firstName !== 'Sin nombre') persona.firstName = firstName;
          if (lastName !== 'Sin apellido' && lastName !== 'Pendiente') persona.lastName = lastName;
          persona = await queryRunner.manager.save(persona);
        }

        if (!persona.ciudadano) {
          const isCitizen = !jwtPayload.roles || jwtPayload.roles.length === 0 || jwtPayload.roles.some(
            (r: any) => typeof r === 'string' && (
              r.toUpperCase().includes('CITIZEN') ||
              r.toUpperCase().includes('CIUDADANO') ||
              r.toUpperCase().includes('USER')
            )
          );
          if (isCitizen) {
            const ciudadano = queryRunner.manager.create(Ciudadano, { persona });
            const savedCiudadano = await queryRunner.manager.save(ciudadano);
            persona.ciudadano = savedCiudadano;

            let metodoPago = await queryRunner.manager.findOne(MetodoPago, {
              where: { tipo: MetodoPagoTipo.TARJETA }
            });

            if (!metodoPago) {
              metodoPago = queryRunner.manager.create(MetodoPago, {
                tipo: MetodoPagoTipo.TARJETA,
                descripcion: 'Tarjeta Virtual TuLlave / Metro (Por defecto)'
              });
              metodoPago = await queryRunner.manager.save(metodoPago);
            }

            const billetera = queryRunner.manager.create(MetodoPagoCiudadano, {
              ciudadano: savedCiudadano,
              metodoPago: metodoPago,
              saldo: 20000
            });
            await queryRunner.manager.save(billetera);
          }
        } else {
          const isAsesor = jwtPayload.roles?.some(
            (r: any) => typeof r === 'string' &&
              r.toUpperCase().includes('ASESOR')
          );
          if (isAsesor) {
            const asesorExistente = await queryRunner.manager.findOne(Asesor, {
              where: {
                persona: {
                  id: persona.id,
                },
              },
            });

            if (!asesorExistente) {
              const asesor = queryRunner.manager.create(Asesor, {
                persona,
                calendarId: persona.email,
                disponible: true,
              });

              await queryRunner.manager.save(asesor);
            }
          }
        }
      }

      await queryRunner.commitTransaction();

      return {
        id: persona.id,
        auth_id: persona.authId,
        email: persona.email,
        firstName: persona.firstName,
        lastName: persona.lastName,
        birthDate: persona.birthDate
          ? new Date(persona.birthDate).toISOString().slice(0, 10)
          : null,
        phone: persona.phone || null,
        personaId: persona.id,
        roles: jwtPayload.roles,
        ciudadanoId: persona.ciudadano?.id || null,
        conductorId: persona.conductor?.id || null,
        asesorId: persona.asesor?.id || null,
        asesorCalendarId: persona.asesor?.calendarId || null,
        status: 'SYNCED'
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException('Error synchronizing user: ' + err.message);
    } finally {
      await queryRunner.release();
    }
  }
}