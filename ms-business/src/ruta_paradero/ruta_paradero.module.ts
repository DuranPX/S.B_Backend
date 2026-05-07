// src/ruta-paradero/ruta-paradero.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RutaParadero } from './entities/ruta_paradero.entity';
import { RutaParaderoService } from './ruta_paradero.service';
import { RutaParaderoController } from './ruta_paradero.controller';
import { RutaModule } from '../ruta/ruta.module';
import { ParaderoModule } from '../paradero/paradero.module';

@Module({
  imports: [TypeOrmModule.forFeature([RutaParadero]), RutaModule, ParaderoModule],
  controllers: [RutaParaderoController],
  providers: [RutaParaderoService],
  exports: [RutaParaderoService],
})
export class RutaParaderoModule {}