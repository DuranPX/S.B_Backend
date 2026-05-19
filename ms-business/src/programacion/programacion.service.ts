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
import { Turno } from '../turno/entities/turno.entity';

@Injectable()
export class ProgramacionService {
  constructor(
    @InjectRepository(Programacion)
    private readonly programacionRepository: Repository<Programacion>,
    @InjectRepository(Turno)
    private readonly turnoRepository: Repository<Turno>,
  ) {}

  async create(createProgramacionDto: CreateProgramacionDto): Promise<Programacion> {
    const { ruta_id, bus_id, fecha, hora_salida, ...rest } = createProgramacionDto;

    // Validación 1 — Bus sin programación activa en el mismo horario
    const conflicto = await this.programacionRepository.findOne({
      where: {
        bus: { id: bus_id } as any,
        fecha: new Date(fecha) as any,
        hora_salida,
        estado: EstadoProgramacion.PROGRAMADO,
      },
    });

    if (conflicto) {
      throw new BadRequestException(
        `El bus ya tiene una programación activa para esa fecha y hora`,
      );
    }

    // Validación 2 — Bus con conductor asignado (turno activo)
    const turno = await this.turnoRepository.findOne({
      where: {
        bus: { id: bus_id } as any,
        estado: 'EN_CURSO' as any,
      },
    });

    if (!turno) {
      throw new BadRequestException(
        `El bus no tiene un conductor asignado en turno activo`,
      );
    }

    const programacion = this.programacionRepository.create({
      ...rest,
      fecha,
      hora_salida,
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