import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateConductorDto } from './dto/create-conductor.dto';
import { UpdateConductorDto } from './dto/update-conductor.dto';
import { Conductor } from './entities/conductor.entity';
import { Empresa } from '../empresa/entities/empresa.entity';
import { PersonaService } from '../persona/persona.service';

import { Turno } from '../turno/entities/turno.entity';

@Injectable()
export class ConductorService {
  constructor(
    @InjectRepository(Conductor)
    private readonly conductorRepo: Repository<Conductor>,
    @InjectRepository(Empresa)
    private readonly empresaRepo: Repository<Empresa>,
    @InjectRepository(Turno)
    private readonly turnoRepo: Repository<Turno>,
    // Inyectamos PersonaService para validar la existencia de la Persona
    private readonly personaService: PersonaService,
  ) {}

  async create(dto: CreateConductorDto): Promise<Conductor> {
    // 1. Validar que la Persona exista
    // Si no existe, findOne lanzará un NotFoundException
    const persona = await this.personaService.findOne(dto.personaId);

    // 2. Validar que la Empresa exista
    const empresa = await this.empresaRepo.findOneBy({ id: dto.empresaId });
    if (!empresa) {
      throw new NotFoundException(
        `Empresa con id "${dto.empresaId}" no encontrada. Un conductor no puede quedar huérfano de empresa.`,
      );
    }

    // 3. Validar que la Persona no sea ya un conductor (relación 1:1)
    const existeConductor = await this.conductorRepo.findOne({
      where: { persona: { id: dto.personaId } },
    });

    if (existeConductor) {
      throw new ConflictException(
        `La persona con id ${dto.personaId} ya está registrada como conductor.`,
      );
    }

    // 4. Crear el Conductor
    const conductor = this.conductorRepo.create({
      licencia: dto.licencia,
      activo: dto.activo ?? true,
      persona: persona,
      empresas: [empresa], // Asignamos la empresa (en un array por ser ManyToMany)
    });

    return this.conductorRepo.save(conductor);
  }

  findAll(): Promise<Conductor[]> {
    return this.conductorRepo.find({
      relations: ['persona', 'empresas'], // Incluimos la empresa también
    });
  }

  async findOne(id: string): Promise<Conductor> {
    const conductor = await this.conductorRepo.findOne({
      where: { id },
      relations: ['persona', 'empresas'],
    });

    if (!conductor) {
      throw new NotFoundException(`Conductor con id "${id}" no encontrado.`);
    }

    return conductor;
  }

  async update(id: string, dto: UpdateConductorDto): Promise<Conductor> {
    const conductor = await this.findOne(id);

    if (dto.licencia !== undefined) conductor.licencia = dto.licencia;
    if (dto.activo !== undefined) conductor.activo = dto.activo;

    return this.conductorRepo.save(conductor);
  }

  async remove(id: string) {
    const conductor = await this.findOne(id);
    
    // Conductor: No eliminar si tiene turnos
    const turnosCount = await this.turnoRepo.count({ where: { conductor: { id } } });
    if (turnosCount > 0) {
      throw new ConflictException(`No se puede eliminar el conductor "${id}" porque tiene turnos asociados.`);
    }

    return await this.conductorRepo.remove(conductor);
  }
}
