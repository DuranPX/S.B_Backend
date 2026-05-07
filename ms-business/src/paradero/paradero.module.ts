// src/paradero/paradero.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Paradero } from './entities/paradero.entity';
import { ParaderoService } from './paradero.service';
import { ParaderoController } from './paradero.controller';
import { NodoModule } from '../nodo/nodo.module';

@Module({
  imports: [TypeOrmModule.forFeature([Paradero]), NodoModule],
  controllers: [ParaderoController],
  providers: [ParaderoService],
  exports: [ParaderoService],
})
export class ParaderoModule {}