import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { CreateTurnoDto } from './dto/create-turno.dto';
import { UpdateTurnoDto } from './dto/update-turno.dto';
import { Turno } from './entities/turno.entity';
import { Conductor } from '../conductor/entities/conductor.entity';
import { Bus } from '../bus/entities/bus.entity';

@Injectable()
export class TurnoService {
  constructor(
    @InjectRepository(Turno)
    private readonly turnoRepository: Repository<Turno>,
    @InjectRepository(Conductor)
    private readonly conductorRepository: Repository<Conductor>,
    @InjectRepository(Bus)
    private readonly busRepository: Repository<Bus>,
  ) { }

  async create(createTurnoDto: CreateTurnoDto) {
    const { conductorId, busId, ...rest } = createTurnoDto;

    const conductor = await this.conductorRepository.findOne({ where: { id: conductorId } });
    if (!conductor) throw new NotFoundException(`Conductor with ID ${conductorId} not found`);

    const bus = await this.busRepository.findOne({ where: { id: busId } });
    if (!bus) throw new NotFoundException(`Bus with ID ${busId} not found`);

    const turno = this.turnoRepository.create({
      ...rest,
      conductor,
      bus,
    });
    return await this.turnoRepository.save(turno);
  }

  async findAll() {
    return await this.turnoRepository.find({
      relations: ['conductor', 'bus'],
    });
  }

  async findOne(id: string) {
    const turno = await this.turnoRepository.findOne({
      where: { id },
      relations: ['conductor', 'bus'],
    });
    if (!turno) {
      throw new NotFoundException(`Turno with ID ${id} not found`);
    }
    return turno;
  }

  async update(id: string, updateTurnoDto: UpdateTurnoDto) {
    const turno = await this.findOne(id);
    const { conductorId, busId, ...rest } = updateTurnoDto;

    Object.assign(turno, rest);

    if (conductorId) {
      const conductor = await this.conductorRepository.findOne({ where: { id: conductorId } });
      if (!conductor) throw new NotFoundException(`Conductor with ID ${conductorId} not found`);
      turno.conductor = conductor;
    }

    if (busId) {
      const bus = await this.busRepository.findOne({ where: { id: busId } });
      if (!bus) throw new NotFoundException(`Bus with ID ${busId} not found`);
      turno.bus = bus;
    }

    return await this.turnoRepository.save(turno);
  }

  async remove(id: string) {
    const turno = await this.findOne(id);
    return await this.turnoRepository.remove(turno);
  }

  async findTurnoConductorActivo(conductorId: string) {
    const ahora = new Date();
    const inicioDia = new Date(ahora);
    inicioDia.setHours(0, 0, 0, 0);
    const finDia = new Date(ahora);
    finDia.setHours(23, 59, 59, 999);

    const turno = await this.turnoRepository.findOne({
      where: {
        conductor: { id: conductorId },
        estado: 'PROGRAMADO',
        fecha_inicio_programada: Between(inicioDia, finDia)
      },
      relations: ['conductor', 'bus', 'bus.gps']
    });

    if (!turno) {
      throw new NotFoundException(
        `No hay turnos programados para el conductor ${conductorId} en el día de hoy`
      );
    }

    return turno;
  }

  async iniciarTurno(id: string, observaciones?: string) {
    const turno = await this.findOne(id);

    if (turno.estado !== 'PROGRAMADO') {
      throw new BadRequestException(
        `El turno no puede iniciarse porque está en estado: ${turno.estado}`
      );
    }

    turno.estado = 'EN_CURSO';
    turno.fecha_inicio_real = new Date();
    if (observaciones) {
      turno.observaciones = observaciones;
    }

    return await this.turnoRepository.save(turno);
  }
}