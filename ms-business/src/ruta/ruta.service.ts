// src/ruta/ruta.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ruta } from './entities/ruta.entity';
import { CreateRutaDto } from './dto/create-ruta.dto';
import { UpdateRutaDto } from './dto/update-ruta.dto';

@Injectable()
export class RutaService {
  constructor(
    @InjectRepository(Ruta)
    private readonly rutaRepository: Repository<Ruta>,
  ) {}

  async create(createRutaDto: CreateRutaDto): Promise<Ruta> {
    const ruta = this.rutaRepository.create(createRutaDto);
    return await this.rutaRepository.save(ruta);
  }

  async findAll(): Promise<Ruta[]> {
    return await this.rutaRepository.find();
  }

  async findOne(id: string): Promise<Ruta> {
    const ruta = await this.rutaRepository.findOne({
      where: { id },
    });

    if (!ruta) {
      throw new NotFoundException(`Ruta con id ${id} no encontrado`);
    }

    return ruta;
  }

  async findRutaCompleta(id: string): Promise<Ruta> {
    const ruta = await this.rutaRepository.findOne({
      where: { id },
      relations: [
        'rutaNodos',
        'rutaNodos.nodo',
        'rutaParaderos',
        'rutaParaderos.paradero',
        'rutaParaderos.paradero.nodo',
      ],
      order: {
        rutaNodos: { orden: 'ASC' },
        rutaParaderos: { orden: 'ASC' },
      },
    });

    if (!ruta) {
      throw new NotFoundException(`Ruta con id ${id} no encontrada`);
    }

    return ruta;
  }

  async update(id: string, updateRutaDto: UpdateRutaDto): Promise<Ruta> {
    const ruta = await this.findOne(id);
    Object.assign(ruta, updateRutaDto);
    return await this.rutaRepository.save(ruta);
  }

  async remove(id: string): Promise<void> {
    const ruta = await this.findOne(id);
    await this.rutaRepository.remove(ruta);
  }
}