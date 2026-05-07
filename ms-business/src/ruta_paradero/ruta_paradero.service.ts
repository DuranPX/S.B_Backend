// src/ruta-paradero/ruta-paradero.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RutaParadero } from './entities/ruta_paradero.entity';
import { CreateRutaParaderoDto } from './dto/create-ruta_paradero.dto';
import { UpdateRutaParaderoDto } from './dto/update-ruta_paradero.dto';
import { RutaService } from '../ruta/ruta.service';
import { ParaderoService } from '../paradero/paradero.service';

@Injectable()
export class RutaParaderoService {
  constructor(
    @InjectRepository(RutaParadero)
    private readonly rutaParaderoRepository: Repository<RutaParadero>,
    private readonly rutaService: RutaService,
    private readonly paraderoService: ParaderoService,
  ) {}

  async create(createRutaParaderoDto: CreateRutaParaderoDto): Promise<RutaParadero> {
    const { ruta_id, paradero_id, orden, ...rest } = createRutaParaderoDto;

    // Verificamos que la ruta y el paradero existen
    const ruta = await this.rutaService.findOne(ruta_id);
    const paradero = await this.paraderoService.findOne(paradero_id);

    // Verificamos que no exista ese orden en la ruta
    const ordenExiste = await this.rutaParaderoRepository.findOne({
      where: { ruta: { id: ruta_id }, orden },
    });

    if (ordenExiste) {
      throw new BadRequestException(
        `Ya existe un paradero con el orden ${orden} en esta ruta`,
      );
    }

    const rutaParadero = this.rutaParaderoRepository.create({
      ...rest,
      ruta,
      paradero,
      orden,
    });

    return await this.rutaParaderoRepository.save(rutaParadero);
  }

  async findAll(): Promise<RutaParadero[]> {
    return await this.rutaParaderoRepository.find({
      relations: ['ruta', 'paradero'],
      order: { orden: 'ASC' },
    });
  }

  async findOne(id: string): Promise<RutaParadero> {
    const rutaParadero = await this.rutaParaderoRepository.findOne({
      where: { id },
      relations: ['ruta', 'paradero'],
    });

    if (!rutaParadero) {
      throw new NotFoundException(`RutaParadero con id ${id} no encontrado`);
    }

    return rutaParadero;
  }

  async findByRuta(ruta_id: string): Promise<RutaParadero[]> {
    return await this.rutaParaderoRepository.find({
      where: { ruta: { id: ruta_id } },
      relations: ['paradero', 'paradero.nodo'],
      order: { orden: 'ASC' },
    });
  }

  async update(id: string, updateRutaParaderoDto: UpdateRutaParaderoDto): Promise<RutaParadero> {
    const rutaParadero = await this.findOne(id);
    const { ruta_id, paradero_id, orden, ...rest } = updateRutaParaderoDto;

    // Si viene orden nuevo, verificamos que no esté ocupado en esa ruta
    if (orden && orden !== rutaParadero.orden) {
      const rutaId = ruta_id ?? rutaParadero.ruta.id;
      const ordenExiste = await this.rutaParaderoRepository.findOne({
        where: { ruta: { id: rutaId }, orden },
      });

      if (ordenExiste) {
        throw new BadRequestException(
          `Ya existe un paradero con el orden ${orden} en esta ruta`,
        );
      }
    }

    if (ruta_id) rutaParadero.ruta = await this.rutaService.findOne(ruta_id);
    if (paradero_id) rutaParadero.paradero = await this.paraderoService.findOne(paradero_id);
    if (orden) rutaParadero.orden = orden;

    Object.assign(rutaParadero, rest);
    return await this.rutaParaderoRepository.save(rutaParadero);
  }

  async remove(id: string): Promise<void> {
    const rutaParadero = await this.findOne(id);
    await this.rutaParaderoRepository.remove(rutaParadero);
  }
}