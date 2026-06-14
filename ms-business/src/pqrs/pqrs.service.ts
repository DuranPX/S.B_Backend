import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pqrs } from './entities/pqrs.entity';
import { CreatePqrsDto, UpdatePqrsEstadoDto } from './dto/pqrs.dto';

@Injectable()
export class PqrsService {
  constructor(
    @InjectRepository(Pqrs)
    private readonly pqrsRepository: Repository<Pqrs>,
  ) {}

  async create(dto: CreatePqrsDto): Promise<Pqrs> {
    const existe = await this.pqrsRepository.findOne({
      where: { radicado: dto.radicado },
    });

    if (existe) {
      throw new ConflictException(
        `Ya existe una PQRS con radicado ${dto.radicado}`,
      );
    }

    const pqrs = this.pqrsRepository.create(dto);
    return this.pqrsRepository.save(pqrs);
  }

  async findAll(): Promise<Pqrs[]> {
    return this.pqrsRepository.find({
      order: { creadoEn: 'DESC' },
    });
  }

  async findByRadicado(radicado: string): Promise<Pqrs> {
    const pqrs = await this.pqrsRepository.findOne({
      where: { radicado },
    });

    if (!pqrs) {
      throw new NotFoundException(
        `PQRS con radicado ${radicado} no encontrada`,
      );
    }

    return pqrs;
  }

  async findOne(id: string): Promise<Pqrs> {
    const pqrs = await this.pqrsRepository.findOne({ where: { id } });

    if (!pqrs) {
      throw new NotFoundException(`PQRS con id ${id} no encontrada`);
    }

    return pqrs;
  }

  async updateEstado(radicado: string, dto: UpdatePqrsEstadoDto): Promise<Pqrs> {
    const pqrs = await this.findByRadicado(radicado);
    pqrs.estado = dto.estado;
    if (dto.respuesta) pqrs.respuesta = dto.respuesta;
    return this.pqrsRepository.save(pqrs);
  }
}