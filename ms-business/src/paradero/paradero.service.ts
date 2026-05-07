// src/paradero/paradero.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Paradero } from './entities/paradero.entity';
import { CreateParaderoDto } from './dto/create-paradero.dto';
import { UpdateParaderoDto } from './dto/update-paradero.dto';
import { NodoService } from '../nodo/nodo.service';

@Injectable()
export class ParaderoService {
  constructor(
    @InjectRepository(Paradero)
    private readonly paraderoRepository: Repository<Paradero>,
    private readonly nodoService: NodoService,
  ) {}

  async create(createParaderoDto: CreateParaderoDto): Promise<Paradero> {
    const { nodo_id, ...rest } = createParaderoDto;

    // Verificamos que el nodo existe antes de crear el paradero
    const nodo = await this.nodoService.findOne(nodo_id);

    const paradero = this.paraderoRepository.create({
      ...rest,
      nodo,
    });

    return await this.paraderoRepository.save(paradero);
  }

  async findAll(): Promise<Paradero[]> {
    return await this.paraderoRepository.find({
      relations: ['nodo'],
    });
  }

  async findOne(id: string): Promise<Paradero> {
    const paradero = await this.paraderoRepository.findOne({
      where: { id },
      relations: ['nodo'],
    });

    if (!paradero) {
      throw new NotFoundException(`Paradero con id ${id} no encontrado`);
    }

    return paradero;
  }

  async update(id: string, updateParaderoDto: UpdateParaderoDto): Promise<Paradero> {
    const paradero = await this.findOne(id);
    const { nodo_id, ...rest } = updateParaderoDto;

    // Si viene nodo_id nuevo, verificamos que existe
    if (nodo_id) {
      const nodo = await this.nodoService.findOne(nodo_id);
      paradero.nodo = nodo;
    }

    Object.assign(paradero, rest);
    return await this.paraderoRepository.save(paradero);
  }

  async remove(id: string): Promise<void> {
    const paradero = await this.findOne(id);
    await this.paraderoRepository.remove(paradero);
  }
}