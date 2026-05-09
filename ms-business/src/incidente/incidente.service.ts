// src/incidente/incidente.service.ts
import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Incidente } from './entities/incidente.entity';
import { CreateIncidenteDto } from './dto/create-incidente.dto';
import { UpdateIncidenteDto } from './dto/update-incidente.dto';

@Injectable()
export class IncidenteService {
  constructor(
    @InjectRepository(Incidente)
    private readonly incidenteRepository: Repository<Incidente>,
  ) {}

  async create(createIncidenteDto: CreateIncidenteDto): Promise<Incidente> {
    const incidente = this.incidenteRepository.create(createIncidenteDto);
    return await this.incidenteRepository.save(incidente);
  }

  async findAll(): Promise<Incidente[]> {
    return await this.incidenteRepository.find({
      relations: ['incidenteBuses', 'incidenteBuses.bus', 'incidenteBuses.fotos'],
    });
  }

  async findOne(id: string): Promise<Incidente> {
    const incidente = await this.incidenteRepository.findOne({
      where: { id },
      relations: ['incidenteBuses', 'incidenteBuses.bus', 'incidenteBuses.fotos'],
    });

    if (!incidente) {
      throw new NotFoundException(`Incidente con id ${id} no encontrado`);
    }

    return incidente;
  }

  async update(id: string, updateIncidenteDto: UpdateIncidenteDto): Promise<Incidente> {
    const incidente = await this.findOne(id);
    Object.assign(incidente, updateIncidenteDto);
    return await this.incidenteRepository.save(incidente);
  }

  async remove(id: string): Promise<void> {
    const incidente = await this.findOne(id);
    await this.incidenteRepository.remove(incidente);
  }
}