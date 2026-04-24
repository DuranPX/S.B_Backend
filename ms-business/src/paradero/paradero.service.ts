import { Injectable } from '@nestjs/common';
import { CreateParaderoDto } from './dto/create-paradero.dto';
import { UpdateParaderoDto } from './dto/update-paradero.dto';

@Injectable()
export class ParaderoService {
  create(createParaderoDto: CreateParaderoDto) {
    return 'This action adds a new paradero';
  }

  findAll() {
    return `This action returns all paradero`;
  }

  findOne(id: number) {
    return `This action returns a #${id} paradero`;
  }

  update(id: number, updateParaderoDto: UpdateParaderoDto) {
    return `This action updates a #${id} paradero`;
  }

  remove(id: number) {
    return `This action removes a #${id} paradero`;
  }
}
