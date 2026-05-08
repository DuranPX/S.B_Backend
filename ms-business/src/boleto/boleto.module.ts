// src/boleto/boleto.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Boleto } from './entities/boleto.entity';
import { BoletoService } from './boleto.service';
import { BoletoController } from './boleto.controller';
import { ProgramacionModule } from '../programacion/programacion.module';
import { HistorialModule } from '../historial/historial.module';
import { HasDisponibilidadConstraint } from '../common/validators/has-disponibilidad.validator';

@Module({
  imports: [
    TypeOrmModule.forFeature([Boleto]),
    ProgramacionModule,
    HistorialModule,
  ],
  controllers: [BoletoController],
  providers: [BoletoService, HasDisponibilidadConstraint],
  exports: [BoletoService],
})
export class BoletoModule {}