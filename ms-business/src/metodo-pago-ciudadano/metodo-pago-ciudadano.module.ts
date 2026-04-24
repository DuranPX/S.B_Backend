import { Module } from '@nestjs/common';
import { MetodoPagoCiudadanoService } from './metodo-pago-ciudadano.service';
import { MetodoPagoCiudadanoController } from './metodo-pago-ciudadano.controller';

@Module({
  controllers: [MetodoPagoCiudadanoController],
  providers: [MetodoPagoCiudadanoService],
})
export class MetodoPagoCiudadanoModule {}
