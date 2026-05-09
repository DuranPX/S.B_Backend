import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MetodoPagoCiudadanoService } from './metodo-pago-ciudadano.service';
import { MetodoPagoCiudadanoController } from './metodo-pago-ciudadano.controller';
import { MetodoPagoCiudadano } from './entities/metodo-pago-ciudadano.entity';
import { CiudadanoModule } from 'src/ciudadano/ciudadano.module';
import { MetodoPagoModule } from 'src/metodo-pago/metodo-pago.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([MetodoPagoCiudadano]),
        CiudadanoModule,
        MetodoPagoModule,
    ],
    controllers: [MetodoPagoCiudadanoController],
    providers: [MetodoPagoCiudadanoService],
    exports: [MetodoPagoCiudadanoService],
})
export class MetodoPagoCiudadanoModule {}