import { Injectable } from '@nestjs/common';
import { CreateNodoDto } from './dto/create-nodo.dto';
import { UpdateNodoDto } from './dto/update-nodo.dto';

@Injectable()
export class NodoService {
  create(createNodoDto: CreateNodoDto) {
    return 'This action adds a new nodo';
  }

  findAll() {
    return `This action returns all nodo`;
  }

  findOne(id: number) {
    return `This action returns a #${id} nodo`;
  }

  update(id: number, updateNodoDto: UpdateNodoDto) {
    return `This action updates a #${id} nodo`;
  }

  remove(id: number) {
    return `This action removes a #${id} nodo`;
  }
}
