import { Injectable } from '@nestjs/common';
import { CreateDestinatarioPersonaDto } from './dto/create-destinatario-persona.dto';
import { UpdateDestinatarioPersonaDto } from './dto/update-destinatario-persona.dto';

@Injectable()
export class DestinatarioPersonaService {
  create(createDestinatarioPersonaDto: CreateDestinatarioPersonaDto) {
    return 'This action adds a new destinatarioPersona';
  }

  findAll() {
    return `This action returns all destinatarioPersona`;
  }

  findOne(id: number) {
    return `This action returns a #${id} destinatarioPersona`;
  }

  update(id: number, updateDestinatarioPersonaDto: UpdateDestinatarioPersonaDto) {
    return `This action updates a #${id} destinatarioPersona`;
  }

  remove(id: number) {
    return `This action removes a #${id} destinatarioPersona`;
  }
}
