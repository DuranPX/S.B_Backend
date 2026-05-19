import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TurnoService } from './turno.service';
import { TurnoController } from './turno.controller';
import { Turno } from './entities/turno.entity';
import { Conductor } from '../conductor/entities/conductor.entity';
import { Bus } from '../bus/entities/bus.entity';
import { Persona } from 'src/persona/entities/persona.entity';
import { TurnoScheduler } from './turno.scheduler';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Module({
  imports: [TypeOrmModule.forFeature([Turno, Conductor, Bus, Persona])],
  controllers: [TurnoController],
  providers: [TurnoService, TurnoScheduler, EventEmitter2],
  exports: [TurnoService],
})
export class TurnoModule { }
