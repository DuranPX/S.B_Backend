// src/historial/historial.service.ts
import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
    const { ciudadano_id, boleto_id, ...rest } = createHistorialDto;

    const historial = this.historialRepository.create({
      ...rest,
      ciudadano: { id: ciudadano_id } as any,
      ...(boleto_id && { boleto: { id: boleto_id } as any }),
    });

    return await this.historialRepository.save(historial);
  }

  async findAll(): Promise<Historial[]> {
    return await this.historialRepository.find({
      relations: ['ciudadano', 'boleto'],
      order: { fecha: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Historial> {
    const historial = await this.historialRepository.findOne({
      where: { id },
      relations: ['ciudadano', 'boleto'],
    });

    if (!historial) {
      throw new NotFoundException(`Historial con id ${id} no encontrado`);
    }

    return historial;
  }

  async findByciudadano(ciudadano_id: string): Promise<Historial[]> {
    return await this.historialRepository.find({
      where: { ciudadano: { id: ciudadano_id } as any },
      relations: ['boleto', 'boleto.programacion', 'boleto.paraderoAbordaje', 'boleto.paraderoDescenso'],
      order: { fecha: 'DESC' },
    });
  }

  async findViajesByCiudadano(ciudadano_id: string): Promise<Historial[]> {
    return await this.historialRepository.find({
      where: {
        ciudadano: { id: ciudadano_id } as any,
        tipo: TipoHistorial.VIAJE,
      },
      relations: ['boleto', 'boleto.programacion', 'boleto.paraderoAbordaje', 'boleto.paraderoDescenso'],
      order: { fecha: 'DESC' },
    });
  }

  async update(id: string, updateHistorialDto: UpdateHistorialDto): Promise<Historial> {
    const historial = await this.findOne(id);
    const { ciudadano_id, boleto_id, ...rest } = updateHistorialDto;

    if (ciudadano_id) historial.ciudadano = { id: ciudadano_id } as any;
    if (boleto_id) historial.boleto = { id: boleto_id } as any;

    Object.assign(historial, rest);
    return await this.historialRepository.save(historial);
  }
}