import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GrupoPersonaService } from './grupo-persona.service';
import { GrupoPersonaController } from './grupo-persona.controller';
import { GrupoPersona } from './entities/grupo-persona.entity';
import { Persona } from '../persona/entities/persona.entity';
import { Grupo } from '../grupo/entities/grupo.entity';

@Module({
  imports: [TypeOrmModule.forFeature([GrupoPersona, Persona, Grupo])],
  controllers: [GrupoPersonaController],
  providers: [GrupoPersonaService],
  exports: [GrupoPersonaService],
})
export class GrupoPersonaModule {}
