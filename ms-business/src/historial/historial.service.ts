// src/historial/historial.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Historial, TipoHistorial } from './entities/historial.entity';
import { CreateHistorialDto } from './dto/create-historial.dto';
import { UpdateHistorialDto } from './dto/update-historial.dto';

@Injectable()
export class HistorialService {
  constructor(
    @InjectRepository(Historial)
    private readonly historialRepository: Repository<Historial>,
  ) {}

  async create(createHistorialDto: CreateHistorialDto): Promise<Historial> {
    const { boleto_id, ...rest } = createHistorialDto;

    const historial = this.historialRepository.create({
      ...rest,
      ...(boleto_id && { boleto: { id: boleto_id } as any }),
    });

    return await this.historialRepository.save(historial);
  }

  async findAll(): Promise<Historial[]> {
    return await this.historialRepository.find({
      relations: ['boleto'],
      order: { fecha: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Historial> {
    const historial = await this.historialRepository.findOne({
      where: { id },
      relations: ['boleto'],
    });

    if (!historial) {
      throw new NotFoundException(`Historial con id ${id} no encontrado`);
    }

    return historial;
  }

  async findByBoleto(boleto_id: string): Promise<Historial[]> {
    return await this.historialRepository.find({
      where: { boleto: { id: boleto_id } as any },
      relations: ['boleto', 'boleto.programacion', 'boleto.paraderoAbordaje', 'boleto.paraderoDescenso'],
      order: { fecha: 'DESC' },
    });
  }

  async findViajes(): Promise<Historial[]> {
    return await this.historialRepository.find({
      where: { tipo: TipoHistorial.VIAJE },
      relations: ['boleto', 'boleto.programacion', 'boleto.paraderoAbordaje', 'boleto.paraderoDescenso'],
      order: { fecha: 'DESC' },
    });
  }

  async update(id: string, updateHistorialDto: UpdateHistorialDto): Promise<Historial> {
    const historial = await this.findOne(id);
    const { boleto_id, ...rest } = updateHistorialDto;

    if (boleto_id) historial.boleto = { id: boleto_id } as any;

    Object.assign(historial, rest);
    return await this.historialRepository.save(historial);
  }
}