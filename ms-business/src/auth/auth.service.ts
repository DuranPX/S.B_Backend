import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Persona, TipoDocumento } from '../persona/entities/persona.entity';
import { Ciudadano } from '../ciudadano/entities/ciudadano.entity';

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
        // Si no vienen roles, asumiremos ciudadano para simplificar el flujo o si explícitamente viene Citizen
        const isCitizen = jwtPayload.roles.includes('Citizen') || jwtPayload.roles.length === 0;
        
        if (isCitizen) {
          const ciudadano = queryRunner.manager.create(Ciudadano, { persona });
          await queryRunner.manager.save(ciudadano);
          persona.ciudadano = ciudadano;
        }
      } else {
        // Actualizar datos si es necesario
        if (jwtPayload.email && persona.email !== jwtPayload.email) {
          persona.email = jwtPayload.email;
          persona = await queryRunner.manager.save(persona);
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
