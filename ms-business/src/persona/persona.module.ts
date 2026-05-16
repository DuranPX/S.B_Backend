import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Persona } from './entities/persona.entity';
import { PersonaController } from './persona.controller';
import { PersonaService } from './persona.service';

import { Conductor } from '../conductor/entities/conductor.entity';
import { GrupoPersona } from '../grupo-persona/entities/grupo-persona.entity';
import { Mensaje } from '../mensaje/entities/mensaje.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Persona, Conductor, GrupoPersona, Mensaje]),
  ],
  controllers: [PersonaController],
  providers: [PersonaService],
  // Se exporta PersonaService para que los módulos hijos (Conductor, Ciudadano)
  // puedan reutilizar la lógica de Persona (ej: findOne, validar existencia)
  // sin duplicar código. Importar PersonaModule en cada módulo hijo.
  exports: [PersonaService],
})
export class PersonaModule { }
