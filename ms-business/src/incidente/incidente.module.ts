// src/incidente/incidente.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { Incidente } from './entities/incidente.entity';
import { IncidenteService } from './incidente.service';
import { IncidenteController } from './incidente.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Incidente]), HttpModule],
  controllers: [IncidenteController],
  providers: [IncidenteService],
  exports: [IncidenteService],
})
export class IncidenteModule {}