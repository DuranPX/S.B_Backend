import { Module } from '@nestjs/common';
import { CiudadanoService } from './ciudadano.service';
import { CiudadanoController } from './ciudadano.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ciudadano } from './entities/ciudadano.entity';
import { PersonaModule } from '../persona/persona.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ciudadano]),
    PersonaModule,
  ],
  controllers: [CiudadanoController],
  providers: [CiudadanoService],
  exports: [CiudadanoService],
})
export class CiudadanoModule { }
