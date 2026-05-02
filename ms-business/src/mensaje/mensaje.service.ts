import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateMensajeDto } from './dto/create-mensaje.dto';
import { UpdateMensajeDto } from './dto/update-mensaje.dto';
import { Mensaje } from './entities/mensaje.entity';
import { Persona } from '../persona/entities/persona.entity';

@Injectable()
export class MensajeService {
  constructor(
    @InjectRepository(Mensaje)
    private readonly mensajeRepository: Repository<Mensaje>,
    @InjectRepository(Persona)
    private readonly personaRepository: Repository<Persona>,
  ) {}

  async create(createMensajeDto: CreateMensajeDto) {
    const { emisorId, ...rest } = createMensajeDto;
    
    const emisor = await this.personaRepository.findOne({ where: { id: emisorId } });
    if (!emisor) throw new NotFoundException(`Persona (Emisor) with ID ${emisorId} not found`);

    const mensaje = this.mensajeRepository.create({
      ...rest,
      emisor,
    });
    return await this.mensajeRepository.save(mensaje);
  }

  async findAll() {
    return await this.mensajeRepository.find({
      relations: ['emisor'],
    });
  }

  async findOne(id: string) {
    const mensaje = await this.mensajeRepository.findOne({
      where: { id },
      relations: ['emisor'],
    });
    if (!mensaje) {
      throw new NotFoundException(`Mensaje with ID ${id} not found`);
    }
    return mensaje;
  }

  async update(id: string, updateMensajeDto: UpdateMensajeDto) {
    const mensaje = await this.findOne(id);
    const { emisorId, ...rest } = updateMensajeDto;
    
    Object.assign(mensaje, rest);
    
    if (emisorId) {
      const emisor = await this.personaRepository.findOne({ where: { id: emisorId } });
      if (!emisor) throw new NotFoundException(`Persona (Emisor) with ID ${emisorId} not found`);
      mensaje.emisor = emisor;
    }
    
    return await this.mensajeRepository.save(mensaje);
  }

  async remove(id: string) {
    const mensaje = await this.findOne(id);
    return await this.mensajeRepository.remove(mensaje);
  }
}
