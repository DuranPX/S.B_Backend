import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MensajeService } from './mensaje.service';
import { MensajeController } from './mensaje.controller';
import { Mensaje } from './entities/mensaje.entity';
import { Persona } from '../persona/entities/persona.entity';
import { DestinatarioPersona } from '../destinatario-persona/entities/destinatario-persona.entity';
import { DestinatarioGrupo } from '../destinatario-grupo/entities/destinatario-grupo.entity';
import { Grupo } from '../grupo/entities/grupo.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Mensaje, Persona, DestinatarioPersona, DestinatarioGrupo, Grupo])],
    controllers: [MensajeController],
    providers: [MensajeService],
    exports: [MensajeService],
})
export class MensajeModule {}