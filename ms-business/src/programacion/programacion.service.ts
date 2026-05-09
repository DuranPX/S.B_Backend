// src/programacion/programacion.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Programacion, EstadoProgramacion } from './entities/programacion.entity';
import { CreateProgramacionDto } from './dto/create-programacion.dto';
import { UpdateProgramacionDto } from './dto/update-programacion.dto';

@Injectable()
export class ProgramacionService {
  constructor(
    @InjectRepository(Programacion)
    private readonly programacionRepository: Repository<Programacion>,
  ) {}

  async create(createProgramacionDto: CreateProgramacionDto): Promise<Programacion> {
    const { ruta_id, bus_id, ...rest } = createProgramacionDto;

    const programacion = this.programacionRepository.create({
      ...rest,
      ruta: { id: ruta_id } as any,
      bus: { id: bus_id } as any,
    });

    return await this.programacionRepository.save(programacion);
  }

  async findAll(): Promise<Programacion[]> {
    return await this.programacionRepository.find({
      relations: ['ruta', 'bus'],
    });
  }

  async findOne(id: string): Promise<Programacion> {
    const programacion = await this.programacionRepository.findOne({
      where: { id },
      relations: ['ruta', 'bus'],
    });

    if (!programacion) {
      throw new NotFoundException(`Programacion con id ${id} no encontrada`);
    }

    return programacion;
  }

  async incrementarPasajero(id: string): Promise<void> {
    const programacion = await this.findOne(id);

    if (programacion.estado !== EstadoProgramacion.PROGRAMADO) {
      throw new BadRequestException('La programación no está en estado Programado');
    }

    await this.programacionRepository.increment({ id }, 'pasajeros_actuales', 1);
  }

  async update(id: string, updateProgramacionDto: UpdateProgramacionDto): Promise<Programacion> {
    const programacion = await this.findOne(id);
    const { ruta_id, bus_id, ...rest } = updateProgramacionDto;

    if (ruta_id) programacion.ruta = { id: ruta_id } as any;
    if (bus_id) programacion.bus = { id: bus_id } as any;

    Object.assign(programacion, rest);
    return await this.programacionRepository.save(programacion);
  }

  async remove(id: string): Promise<void> {
    const programacion = await this.findOne(id);

    if (programacion.estado !== EstadoProgramacion.PROGRAMADO) {
      throw new BadRequestException('Solo se pueden eliminar programaciones en estado Programado');
    }

    await this.programacionRepository.remove(programacion);
  }
}