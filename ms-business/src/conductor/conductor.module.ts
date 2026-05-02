import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConductorService } from './conductor.service';
import { ConductorController } from './conductor.controller';
import { Conductor } from './entities/conductor.entity';
import { Empresa } from '../empresa/entities/empresa.entity';
import { PersonaModule } from '../persona/persona.module';

import { Turno } from '../turno/entities/turno.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Conductor, Empresa, Turno]),
    // Importamos PersonaModule para que PersonaService esté disponible para inyectar
    PersonaModule,
  ],
  controllers: [ConductorController],
  providers: [ConductorService],
  exports: [ConductorService], // Exportamos en caso de que otro módulo lo necesite
})
export class ConductorModule {}
