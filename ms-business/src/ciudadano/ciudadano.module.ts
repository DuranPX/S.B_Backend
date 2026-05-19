import { Module } from '@nestjs/common';
import { CiudadanoService } from './ciudadano.service';
import { CiudadanoController } from './ciudadano.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ciudadano } from './entities/ciudadano.entity';
import { PersonaModule } from '../persona/persona.module';
import { MetodoPagoCiudadano } from '../metodo-pago-ciudadano/entities/metodo-pago-ciudadano.entity';
import { MetodoPago } from '../metodo-pago/entities/metodo-pago.entity';
import { Persona } from '../persona/entities/persona.entity';
import { Boleto } from 'src/boleto/entities/boleto.entity';
import { Programacion } from 'src/programacion/entities/programacion.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ciudadano, MetodoPagoCiudadano, MetodoPago, Persona, Boleto, Programacion]),
    PersonaModule,
  ],
  controllers: [CiudadanoController],
  providers: [CiudadanoService],
  exports: [CiudadanoService],
})
export class CiudadanoModule { }
