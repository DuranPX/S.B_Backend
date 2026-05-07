// src/ruta-nodo/ruta-nodo.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RutaNodo } from './entities/ruta_nodo.entity';
import { RutaNodoService } from './ruta_nodo.service';
import { RutaNodoController } from './ruta_nodo.controller';
import { RutaModule } from '../ruta/ruta.module';
import { NodoModule } from '../nodo/nodo.module';
import { IsUniqueOrdenConstraint } from '../common/validators/is-unique-orden.validator';

@Module({
  imports: [TypeOrmModule.forFeature([RutaNodo]), RutaModule, NodoModule],
  controllers: [RutaNodoController],
  providers: [RutaNodoService, IsUniqueOrdenConstraint],
  exports: [RutaNodoService],
})
export class RutaNodoModule {}