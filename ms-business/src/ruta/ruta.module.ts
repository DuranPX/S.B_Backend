// src/ruta/ruta.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ruta } from './entities/ruta.entity';
import { RutaService } from './ruta.service';
import { RutaController } from './ruta.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Ruta])],
  controllers: [RutaController],
  providers: [RutaService],
  exports: [RutaService],
})
export class RutaModule {}