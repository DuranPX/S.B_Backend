import { Module } from '@nestjs/common';
import { GrupoPersonaService } from './grupo-persona.service';
import { GrupoPersonaController } from './grupo-persona.controller';

@Module({
  controllers: [GrupoPersonaController],
  providers: [GrupoPersonaService],
})
export class GrupoPersonaModule {}
