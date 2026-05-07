// src/nodo/nodo.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Nodo } from './entities/nodo.entity';
import { NodoService } from './nodo.service';
import { NodoController } from './nodo.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Nodo])],
  controllers: [NodoController],
  providers: [NodoService],
  exports: [NodoService],
})
export class NodoModule {}