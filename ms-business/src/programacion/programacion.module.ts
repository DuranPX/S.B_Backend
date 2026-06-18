// src/programacion/programacion.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Programacion } from './entities/programacion.entity';
import { ProgramacionService } from './programacion.service';
import { ProgramacionController } from './programacion.controller';
import { Turno } from 'src/turno/entities/turno.entity';
import { Ruta } from 'src/ruta/entities/ruta.entity';
import { Bus } from 'src/bus/entities/bus.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Programacion, Turno, Ruta, Bus])],
  controllers: [ProgramacionController],
  providers: [ProgramacionService],
  exports: [TypeOrmModule, ProgramacionService],
})
export class ProgramacionModule { }