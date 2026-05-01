import { Module } from '@nestjs/common';
import { DestinatarioPersonaService } from './destinatario-persona.service';
import { DestinatarioPersonaController } from './destinatario-persona.controller';

@Module({
  controllers: [DestinatarioPersonaController],
  providers: [DestinatarioPersonaService],
})
export class DestinatarioPersonaModule {}
