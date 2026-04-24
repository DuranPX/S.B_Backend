import { Injectable } from '@nestjs/common';
import { CreateBoletoDto } from './dto/create-boleto.dto';
import { UpdateBoletoDto } from './dto/update-boleto.dto';

@Injectable()
export class BoletoService {
  create(createBoletoDto: CreateBoletoDto) {
    return 'This action adds a new boleto';
  }

  findAll() {
    return `This action returns all boleto`;
  }

  findOne(id: number) {
    return `This action returns a #${id} boleto`;
  }

  update(id: number, updateBoletoDto: UpdateBoletoDto) {
    return `This action updates a #${id} boleto`;
  }

  remove(id: number) {
    return `This action removes a #${id} boleto`;
  }
}
