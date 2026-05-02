import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DestinatarioGrupoService } from './destinatario-grupo.service';
import { DestinatarioGrupoController } from './destinatario-grupo.controller';
import { DestinatarioGrupo } from './entities/destinatario-grupo.entity';
import { Mensaje } from '../mensaje/entities/mensaje.entity';
import { Grupo } from '../grupo/entities/grupo.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DestinatarioGrupo, Mensaje, Grupo])],
  controllers: [DestinatarioGrupoController],
  providers: [DestinatarioGrupoService],
  exports: [DestinatarioGrupoService],
})
export class DestinatarioGrupoModule {}
