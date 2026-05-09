// src/foto/foto.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Foto } from './entities/foto.entity';
import { FotoService } from './foto.service';
import { FotoController } from './foto.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Foto])],
  controllers: [FotoController],
  providers: [FotoService],
  exports: [FotoService],
})
export class FotoModule {}