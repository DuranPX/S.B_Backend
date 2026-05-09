// src/programacion/programacion.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Programacion } from './entities/programacion.entity';
import { ProgramacionService } from './programacion.service';
import { ProgramacionController } from './programacion.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Programacion])],
  controllers: [ProgramacionController],
  providers: [ProgramacionService],
  exports: [TypeOrmModule, ProgramacionService],
})
export class ProgramacionModule {}