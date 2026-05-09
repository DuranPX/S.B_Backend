import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GrupoService } from './grupo.service';
import { GrupoController } from './grupo.controller';
import { Grupo } from './entities/grupo.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Grupo])],
    controllers: [GrupoController],
    providers: [GrupoService],
    exports: [GrupoService],
})
export class GrupoModule {}