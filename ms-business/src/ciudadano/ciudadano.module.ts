import { Module } from '@nestjs/common';
import { CiudadanoService } from './ciudadano.service';
import { CiudadanoController } from './ciudadano.controller';

@Module({
  controllers: [CiudadanoController],
  providers: [CiudadanoService],
})
export class CiudadanoModule {}
