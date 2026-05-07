// src/ruta-nodo/ruta-nodo.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RutaNodo } from './entities/ruta_nodo.entity';
import { CreateRutaNodoDto } from './dto/create-ruta_nodo.dto';
import { UpdateRutaNodoDto } from './dto/update-ruta_nodo.dto';
import { RutaService } from '../ruta/ruta.service';
import { NodoService } from '../nodo/nodo.service';

@Injectable()
export class RutaNodoService {
  constructor(
    @InjectRepository(RutaNodo)
    private readonly rutaNodoRepository: Repository<RutaNodo>,
    private readonly rutaService: RutaService,
    private readonly nodoService: NodoService,
  ) {}

  async create(createRutaNodoDto: CreateRutaNodoDto): Promise<RutaNodo> {
    const { ruta_id, nodo_id, orden, ...rest } = createRutaNodoDto;

    // Verificamos que la ruta y el nodo existen
    const ruta = await this.rutaService.findOne(ruta_id);
    const nodo = await this.nodoService.findOne(nodo_id);

    // Verificamos que no exista ese orden en la ruta
    const ordenExiste = await this.rutaNodoRepository.findOne({
      where: { ruta: { id: ruta_id }, orden },
    });

    if (ordenExiste) {
      throw new BadRequestException(
        `Ya existe un nodo con el orden ${orden} en esta ruta`,
      );
    }

    const rutaNodo = this.rutaNodoRepository.create({
      ...rest,
      ruta,
      nodo,
      orden,
    });

    return await this.rutaNodoRepository.save(rutaNodo);
  }

  async findAll(): Promise<RutaNodo[]> {
    return await this.rutaNodoRepository.find({
      relations: ['ruta', 'nodo'],
      order: { orden: 'ASC' },
    });
  }

  async findOne(id: string): Promise<RutaNodo> {
    const rutaNodo = await this.rutaNodoRepository.findOne({
      where: { id },
      relations: ['ruta', 'nodo'],
    });

    if (!rutaNodo) {
      throw new NotFoundException(`RutaNodo con id ${id} no encontrado`);
    }

    return rutaNodo;
  }

  async findByRuta(ruta_id: string): Promise<RutaNodo[]> {
    return await this.rutaNodoRepository.find({
      where: { ruta: { id: ruta_id } },
      relations: ['nodo'],
      order: { orden: 'ASC' },
    });
  }

  async update(id: string, updateRutaNodoDto: UpdateRutaNodoDto): Promise<RutaNodo> {
    const rutaNodo = await this.findOne(id);
    const { ruta_id, nodo_id, orden, ...rest } = updateRutaNodoDto;

    // Si viene orden nuevo, verificamos que no esté ocupado en esa ruta
    if (orden && orden !== rutaNodo.orden) {
      const rutaId = ruta_id ?? rutaNodo.ruta.id;
      const ordenExiste = await this.rutaNodoRepository.findOne({
        where: { ruta: { id: rutaId }, orden },
      });

      if (ordenExiste) {
        throw new BadRequestException(
          `Ya existe un nodo con el orden ${orden} en esta ruta`,
        );
      }
    }

    if (ruta_id) rutaNodo.ruta = await this.rutaService.findOne(ruta_id);
    if (nodo_id) rutaNodo.nodo = await this.nodoService.findOne(nodo_id);
    if (orden) rutaNodo.orden = orden;

    Object.assign(rutaNodo, rest);
    return await this.rutaNodoRepository.save(rutaNodo);
  }

  async remove(id: string): Promise<void> {
    const rutaNodo = await this.findOne(id);
    await this.rutaNodoRepository.remove(rutaNodo);
  }
}