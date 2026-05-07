import { Module } from '@nestjs/common';
import { DireccionService } from './direccion.service';
import { DireccionController } from './direccion.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CiudadanoModule } from 'src/ciudadano/ciudadano.module';
import { Direccion } from './entities/direccion.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Direccion]),
    CiudadanoModule,
  ],
  controllers: [DireccionController],
  providers: [DireccionService],
  exports: [DireccionService],
})
export class DireccionModule {}