import { Injectable } from '@nestjs/common';
import { CreateDestinatarioGrupoDto } from './dto/create-destinatario-grupo.dto';
import { UpdateDestinatarioGrupoDto } from './dto/update-destinatario-grupo.dto';

@Injectable()
export class DestinatarioGrupoService {
  create(createDestinatarioGrupoDto: CreateDestinatarioGrupoDto) {
    return 'This action adds a new destinatarioGrupo';
  }

  findAll() {
    return `This action returns all destinatarioGrupo`;
  }

  findOne(id: number) {
    return `This action returns a #${id} destinatarioGrupo`;
  }

  update(id: number, updateDestinatarioGrupoDto: UpdateDestinatarioGrupoDto) {
    return `This action updates a #${id} destinatarioGrupo`;
  }

  remove(id: number) {
    return `This action removes a #${id} destinatarioGrupo`;
  }
}
