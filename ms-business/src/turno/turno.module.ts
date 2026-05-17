import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TurnoService } from './turno.service';
import { TurnoController } from './turno.controller';
import { Turno } from './entities/turno.entity';
import { Conductor } from '../conductor/entities/conductor.entity';
import { Bus } from '../bus/entities/bus.entity';
import { Persona } from 'src/persona/entities/persona.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Turno, Conductor, Bus, Persona])],
  controllers: [TurnoController],
  providers: [TurnoService],
  exports: [TurnoService],
})
export class TurnoModule {}
