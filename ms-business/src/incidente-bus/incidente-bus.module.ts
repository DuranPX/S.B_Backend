// src/incidente-bus/incidente-bus.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IncidenteBus } from './entities/incidente-bus.entity';
import { IncidenteBusService } from './incidente-bus.service';
import { IncidenteBusController } from './incidente-bus.controller';
import { IncidenteModule } from '../incidente/incidente.module';
import { FotoModule } from '../foto/foto.module';
import { Turno } from 'src/turno/entities/turno.entity';
import { Conductor } from 'src/conductor/entities/conductor.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([IncidenteBus, Turno, Conductor]),
    IncidenteModule,
    FotoModule,
  ],
  controllers: [IncidenteBusController],
  providers: [IncidenteBusService],
  exports: [IncidenteBusService],
})
export class IncidenteBusModule {}