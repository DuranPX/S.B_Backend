// src/foto/foto.service.ts
import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Foto } from './entities/foto.entity';
import { CreateFotoDto } from './dto/create-foto.dto';
import { UpdateFotoDto } from './dto/update-foto.dto';

@Injectable()
export class FotoService {
  constructor(
    @InjectRepository(Foto)
    private readonly fotoRepository: Repository<Foto>,
  ) {}

  async create(createFotoDto: CreateFotoDto): Promise<Foto> {
    const { incidente_bus_id, ...rest } = createFotoDto;

    const foto = this.fotoRepository.create({
      ...rest,
      incidenteBus: { id: incidente_bus_id } as any,
    });

    return await this.fotoRepository.save(foto);
  }

  async findAll(): Promise<Foto[]> {
    return await this.fotoRepository.find({
      relations: ['incidenteBus'],
    });
  }

  async findOne(id: string): Promise<Foto> {
    const foto = await this.fotoRepository.findOne({
      where: { id },
      relations: ['incidenteBus'],
    });

    if (!foto) {
      throw new NotFoundException(`Foto con id ${id} no encontrada`);
    }

    return foto;
  }

  async findByIncidenteBus(incidente_bus_id: string): Promise<Foto[]> {
    return await this.fotoRepository.find({
      where: { incidenteBus: { id: incidente_bus_id } as any },
      relations: ['incidenteBus'],
    });
  }

  async update(id: string, updateFotoDto: UpdateFotoDto): Promise<Foto> {
    const foto = await this.findOne(id);
    const { incidente_bus_id, ...rest } = updateFotoDto;

    if (incidente_bus_id) foto.incidenteBus = { id: incidente_bus_id } as any;

    Object.assign(foto, rest);
    return await this.fotoRepository.save(foto);
  }

  async remove(id: string): Promise<void> {
    const foto = await this.findOne(id);
    await this.fotoRepository.remove(foto);
  }
}