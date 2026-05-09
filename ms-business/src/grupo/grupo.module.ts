import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GrupoService } from './grupo.service';
import { GrupoController } from './grupo.controller';
import { Grupo } from './entities/grupo.entity';
import { GrupoPersona } from 'src/grupo-persona/entities/grupo-persona.entity';
import { PersonaModule } from 'src/persona/persona.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Grupo, GrupoPersona]),
        PersonaModule,
    ],
    controllers: [GrupoController],
    providers: [GrupoService],
    exports: [GrupoService],
})
export class GrupoModule {}