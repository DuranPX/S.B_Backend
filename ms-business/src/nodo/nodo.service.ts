// src/nodo/nodo.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Nodo } from './entities/nodo.entity';
import { CreateNodoDto } from './dto/create-nodo.dto';
import { UpdateNodoDto } from './dto/update-nodo.dto';

@Injectable()
export class NodoService {
  constructor(
    @InjectRepository(Nodo)
    private readonly nodoRepository: Repository<Nodo>,
  ) {}

  async create(createNodoDto: CreateNodoDto): Promise<Nodo> {
    const nodo = this.nodoRepository.create(createNodoDto);
    return await this.nodoRepository.save(nodo);
  }

  async findAll(): Promise<Nodo[]> {
    return await this.nodoRepository.find({
      relations: ['paraderos'],
    });
  }

  async findOne(id: string): Promise<Nodo> {
    const nodo = await this.nodoRepository.findOne({
      where: { id },
      relations: ['paraderos'],
    });

    if (!nodo) {
      throw new NotFoundException(`Nodo con id ${id} no encontrado`);
    }

    return nodo;
  }

  async update(id: string, updateNodoDto: UpdateNodoDto): Promise<Nodo> {
    const nodo = await this.findOne(id);
    Object.assign(nodo, updateNodoDto);
    return await this.nodoRepository.save(nodo);
  }

  async remove(id: string): Promise<void> {
    const nodo = await this.findOne(id);
    await this.nodoRepository.remove(nodo);
  }
}