import { Injectable } from '@nestjs/common';
import { CreateConductorDto } from './dto/create-conductor.dto';
import { UpdateConductorDto } from './dto/update-conductor.dto';

@Injectable()
export class ConductorService {
  create(createConductorDto: CreateConductorDto) {
    return 'This action adds a new conductor';
  }

  findAll() {
    return `This action returns all conductor`;
  }

  findOne(id: number) {
    return `This action returns a #${id} conductor`;
  }

  update(id: number, updateConductorDto: UpdateConductorDto) {
    return `This action updates a #${id} conductor`;
  }

  remove(id: number) {
    return `This action removes a #${id} conductor`;
  }
}
