import { Injectable } from '@nestjs/common';
import { CreateProgramacionDto } from './dto/create-programacion.dto';
import { UpdateProgramacionDto } from './dto/update-programacion.dto';

@Injectable()
export class ProgramacionService {
  create(createProgramacionDto: CreateProgramacionDto) {
    return 'This action adds a new programacion';
  }

  findAll() {
    return `This action returns all programacion`;
  }

  findOne(id: number) {
    return `This action returns a #${id} programacion`;
  }

  update(id: number, updateProgramacionDto: UpdateProgramacionDto) {
    return `This action updates a #${id} programacion`;
  }

  remove(id: number) {
    return `This action removes a #${id} programacion`;
  }
}
