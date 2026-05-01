import { Injectable } from '@nestjs/common';
import { CreateGrupoPersonaDto } from './dto/create-grupo-persona.dto';
import { UpdateGrupoPersonaDto } from './dto/update-grupo-persona.dto';

@Injectable()
export class GrupoPersonaService {
  create(createGrupoPersonaDto: CreateGrupoPersonaDto) {
    return 'This action adds a new grupoPersona';
  }

  findAll() {
    return `This action returns all grupoPersona`;
  }

  findOne(id: number) {
    return `This action returns a #${id} grupoPersona`;
  }

  update(id: number, updateGrupoPersonaDto: UpdateGrupoPersonaDto) {
    return `This action updates a #${id} grupoPersona`;
  }

  remove(id: number) {
    return `This action removes a #${id} grupoPersona`;
  }
}
