import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MetodoPagoCiudadanoService } from './metodo-pago-ciudadano.service';
import { MetodoPagoCiudadanoController } from './metodo-pago-ciudadano.controller';
import { MetodoPagoCiudadano } from './entities/metodo-pago-ciudadano.entity';
import { CiudadanoModule } from '../ciudadano/ciudadano.module';
import { MetodoPagoModule } from '../metodo-pago/metodo-pago.module';
import { Historial } from '../historial/entities/historial.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([MetodoPagoCiudadano, Historial]),
        CiudadanoModule,
        MetodoPagoModule,
    ],
    controllers: [MetodoPagoCiudadanoController],
    providers: [MetodoPagoCiudadanoService],
    exports: [MetodoPagoCiudadanoService],
})
export class MetodoPagoCiudadanoModule { }