import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DestinatarioPersonaService } from './destinatario-persona.service';
import { DestinatarioPersonaController } from './destinatario-persona.controller';
import { DestinatarioPersona } from './entities/destinatario-persona.entity';
import { Mensaje } from '../mensaje/entities/mensaje.entity';
import { Persona } from '../persona/entities/persona.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DestinatarioPersona, Mensaje, Persona])],
  controllers: [DestinatarioPersonaController],
  providers: [DestinatarioPersonaService],
  exports: [DestinatarioPersonaService],
})
export class DestinatarioPersonaModule {}
