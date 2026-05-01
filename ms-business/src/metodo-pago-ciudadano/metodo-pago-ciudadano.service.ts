import { Injectable } from '@nestjs/common';
import { CreateMetodoPagoCiudadanoDto } from './dto/create-metodo-pago-ciudadano.dto';
import { UpdateMetodoPagoCiudadanoDto } from './dto/update-metodo-pago-ciudadano.dto';

@Injectable()
export class MetodoPagoCiudadanoService {
  create(createMetodoPagoCiudadanoDto: CreateMetodoPagoCiudadanoDto) {
    return 'This action adds a new metodoPagoCiudadano';
  }

  findAll() {
    return `This action returns all metodoPagoCiudadano`;
  }

  findOne(id: number) {
    return `This action returns a #${id} metodoPagoCiudadano`;
  }

  update(id: number, updateMetodoPagoCiudadanoDto: UpdateMetodoPagoCiudadanoDto) {
    return `This action updates a #${id} metodoPagoCiudadano`;
  }

  remove(id: number) {
    return `This action removes a #${id} metodoPagoCiudadano`;
  }
}
