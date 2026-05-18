import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Persona, TipoDocumento } from '../persona/entities/persona.entity';
import { Ciudadano } from '../ciudadano/entities/ciudadano.entity';
import { Conductor } from '../conductor/entities/conductor.entity';
import { MetodoPagoCiudadano } from '../metodo-pago-ciudadano/entities/metodo-pago-ciudadano.entity';
import { MetodoPago, MetodoPagoTipo } from '../metodo-pago/entities/metodo-pago.entity';

@Injectable()
export class AuthService {
  constructor(private dataSource: DataSource) {}

  async syncUser(jwtPayload: any): Promise<any> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Buscar si la persona ya existe mediante auth_id
      let persona = await queryRunner.manager.findOne(Persona, {
        where: { authId: jwtPayload.authId },
        lock: { mode: 'pessimistic_write' },
        relations: ['ciudadano', 'conductor']
      });

      // 2. Si no existe, crear la entidad Persona
      if (!persona) {
        persona = queryRunner.manager.create(Persona, {
          authId: jwtPayload.authId,
          email: jwtPayload.email,
          firstName: jwtPayload.name || 'Usuario',
          lastName: 'Pendiente',
          tipoDocumento: TipoDocumento.CC,
          // Placeholder temporal hasta que el usuario complete su perfil.
          // Usamos los últimos 10 chars del authId para evitar colisiones.
          numeroDocumento: `PEND-${jwtPayload.authId.slice(-8)}`,
        });
        
        persona = await queryRunner.manager.save(persona);

        // 3. Crear el rol de ciudadano por defecto si el JWT tiene el rol
        const isCitizen = !jwtPayload.roles || jwtPayload.roles.length === 0 || jwtPayload.roles.some((r: any) => typeof r === 'string' && (r.toUpperCase().includes('CITIZEN') || r.toUpperCase().includes('CIUDADANO') || r.toUpperCase().includes('USER')));
        
        if (isCitizen) {
          const ciudadano = queryRunner.manager.create(Ciudadano, { persona });
          const savedCiudadano = await queryRunner.manager.save(ciudadano);
          persona.ciudadano = savedCiudadano;

          // --- CREAR BILLETERA VIRTUAL POR DEFECTO PARA EL CIUDADANO ---
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
        // Actualizar datos si es necesario
        if (jwtPayload.email && persona.email !== jwtPayload.email) {
          persona.email = jwtPayload.email;
          persona = await queryRunner.manager.save(persona);
        }

        // Si la persona ya existía pero por algún motivo no se le había creado su Ciudadano o Billetera
        if (!persona.ciudadano) {
          const isCitizen = !jwtPayload.roles || jwtPayload.roles.length === 0 || jwtPayload.roles.some((r: any) => typeof r === 'string' && (r.toUpperCase().includes('CITIZEN') || r.toUpperCase().includes('CIUDADANO') || r.toUpperCase().includes('USER')));
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
        }
      }
      
      await queryRunner.commitTransaction();

      // Devolver un perfil simplificado
      return {
        id: persona.id,
        auth_id: persona.authId,
        email: persona.email,
        roles: jwtPayload.roles,
        ciudadanoId: persona.ciudadano?.id || null,
        conductorId: persona.conductor?.id || null,
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
