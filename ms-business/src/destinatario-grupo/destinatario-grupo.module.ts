import { Module } from '@nestjs/common';
import { DestinatarioGrupoService } from './destinatario-grupo.service';
import { DestinatarioGrupoController } from './destinatario-grupo.controller';

@Module({
  controllers: [DestinatarioGrupoController],
  providers: [DestinatarioGrupoService],
})
export class DestinatarioGrupoModule {}
