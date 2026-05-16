// src/ruta/ruta.service.ts
import { Injectable, NotFoundException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, ILike } from 'typeorm';
import { Ruta } from './entities/ruta.entity';
import { RutaParadero } from '../ruta_paradero/entities/ruta_paradero.entity';
import { RutaNodo } from '../ruta_nodo/entities/ruta_nodo.entity';
import { Paradero } from '../paradero/entities/paradero.entity';
import { Nodo } from '../nodo/entities/nodo.entity';
import { CreateRutaDto } from './dto/create-ruta.dto';
import { UpdateRutaDto } from './dto/update-ruta.dto';
import { CrearRutaFullDto } from './dto/create-ruta-full.dto';

@Injectable()
export class RutaService {
  constructor(
    @InjectRepository(Ruta)
    private readonly rutaRepository: Repository<Ruta>,
    private dataSource: DataSource
  ) {}

  async create(createRutaDto: CreateRutaDto): Promise<Ruta> {
    const ruta = this.rutaRepository.create(createRutaDto);
    return await this.rutaRepository.save(ruta);
  }

  // HU-009: Creación transaccional
  async createFull(dto: CrearRutaFullDto): Promise<Ruta> {
    const paraderosUnicos = new Set(dto.paraderos.map(p => p.paraderoId));
    if (paraderosUnicos.size !== dto.paraderos.length) {
      throw new ConflictException('La ruta no puede tener paraderos duplicados');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const codigo = `RUT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      let tiempoTotal = 0;

      let ruta = queryRunner.manager.create(Ruta, {
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        tarifa: dto.tarifa,
        codigo: codigo,
        tiempo_estimado_total: 0
      });
      
      ruta = await queryRunner.manager.save(ruta);

      for (let i = 0; i < dto.paraderos.length; i++) {
        const item = dto.paraderos[i];
        
        // Validar si el paradero existe
        const paradero = await queryRunner.manager.findOne(Paradero, { where: { id: item.paraderoId } });
        if (!paradero) throw new NotFoundException(`Paradero ${item.paraderoId} no encontrado`);

        const rutaParadero = queryRunner.manager.create(RutaParadero, {
          ruta: ruta,
          paradero: paradero,
          orden: i + 1,
          distancia_anterior: item.distanciaAnterior,
          tiempo_estimado_mins: item.tiempoEstimadoMins
        });

        await queryRunner.manager.save(rutaParadero);
        tiempoTotal += item.tiempoEstimadoMins;
      }

      // -- NUEVO: Procesar Nodos de la ruta (Geometría) --
      if (dto.nodos && dto.nodos.length > 0) {
        for (let j = 0; j < dto.nodos.length; j++) {
          const itemNodo = dto.nodos[j];
          const nodo = await queryRunner.manager.findOne(Nodo, { where: { id: itemNodo.nodoId } });
          if (!nodo) throw new NotFoundException(`Nodo ${itemNodo.nodoId} no encontrado`);

          const rutaNodo = queryRunner.manager.create(RutaNodo, {
            ruta: ruta,
            nodo: nodo,
            orden: j + 1
          });
          await queryRunner.manager.save(rutaNodo);
        }
      }

      ruta.tiempo_estimado_total = tiempoTotal;
      await queryRunner.manager.save(ruta);

      await queryRunner.commitTransaction();
      return ruta;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(err.message);
    } finally {
      await queryRunner.release();
    }
  }

  // HU-001: Filtros de nombre
  async findAll(nombre?: string): Promise<Ruta[]> {
    if (nombre) {
      return await this.rutaRepository.find({
        where: { nombre: ILike(`%${nombre}%`) }
      });
    }
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

  // HU-001: Ruta con paraderos en orden y tiempo estimado
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