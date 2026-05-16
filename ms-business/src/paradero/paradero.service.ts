// src/paradero/paradero.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
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
    private dataSource: DataSource
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

  // HU-002: Búsqueda geoespacial mediante Haversine
  async findNearby(lat: number, lng: number, radiusMeters: number = 1000) {
    const haversine = `
      ( 6371000 * acos( cos( radians(:lat) ) * cos( radians( p.latitud ) ) 
      * cos( radians( p.longitud ) - radians(:lng) ) + sin( radians(:lat) ) 
      * sin( radians( p.latitud ) ) ) )
    `;

    const paraderos = await this.paraderoRepository.createQueryBuilder('p')
      .select(['p.id as id', 'p.nombre as nombre', 'p.latitud as latitud', 'p.longitud as longitud'])
      .addSelect(`${haversine}`, 'distanciaMetros')
      .leftJoin('p.rutaParaderos', 'rp')
      .leftJoin('rp.ruta', 'ruta')
      .addSelect('JSON_ARRAYAGG(JSON_OBJECT("id", ruta.id, "nombre", ruta.nombre))', 'rutas')
      .having(`distanciaMetros < :radiusMeters`)
      .setParameters({ lat, lng, radiusMeters })
      .groupBy('p.id')
      .orderBy('distanciaMetros', 'ASC')
      .limit(5)
      .getRawMany();

    return paraderos;
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