import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asesor } from './entities/asesor.entity';
import { Persona } from '../persona/entities/persona.entity';
import { CreateAsesorDto } from './dto/create-asesor.dto';
import { UpdateAsesorDto } from './dto/update-asesor.dto';

@Injectable()
export class AsesorService {
  constructor(
    @InjectRepository(Asesor)
    private readonly asesorRepository: Repository<Asesor>,

    @InjectRepository(Persona)
    private readonly personaRepository: Repository<Persona>,
  ) {}

  // ──────────────────────────────────────────
  // CREATE
  // ──────────────────────────────────────────
  async create(dto: CreateAsesorDto): Promise<Asesor> {
    // 1. Verificar que la Persona existe
    const persona = await this.personaRepository.findOne({
      where: { id: dto.personaId },
      relations: ['asesor'], // para saber si ya tiene asesor asignado
    });

    if (!persona) {
      throw new NotFoundException(
        `Persona con id ${dto.personaId} no encontrada`,
      );
    }

    // 2. Verificar que esa Persona no tenga ya un Asesor asignado
    if (persona.asesor) {
      throw new ConflictException(
        `La persona con id ${dto.personaId} ya tiene un perfil de asesor asignado`,
      );
    }

    // 3. Verificar que el calendarId no esté en uso por otro asesor
    const calendarExistente = await this.asesorRepository.findOne({
      where: { calendarId: dto.calendarId },
    });

    if (calendarExistente) {
      throw new ConflictException(
        `El calendarId "${dto.calendarId}" ya está registrado en otro asesor`,
      );
    }

    // 4. Crear y guardar
    const asesor = this.asesorRepository.create({
      calendarId: dto.calendarId,
      disponible: dto.disponible ?? true,
      persona,
    });

    return this.asesorRepository.save(asesor);
  }

  // ──────────────────────────────────────────
  // READ ALL
  // ──────────────────────────────────────────
  async findAll(): Promise<Asesor[]> {
    return this.asesorRepository.find({
      relations: ['persona'],
      order: { persona: { firstName: 'ASC' } },
    });
  }

  // ──────────────────────────────────────────
  // READ ALL DISPONIBLES  ← n8n llamará a este endpoint
  // ──────────────────────────────────────────
  async findDisponibles(): Promise<Asesor[]> {
    return this.asesorRepository.find({
      where: { disponible: true },
      relations: ['persona'],
    });
  }

  // ──────────────────────────────────────────
  // READ ONE
  // ──────────────────────────────────────────
  async findOne(id: string): Promise<Asesor> {
    const asesor = await this.asesorRepository.findOne({
      where: { id },
      relations: ['persona'],
    });

    if (!asesor) {
      throw new NotFoundException(`Asesor con id ${id} no encontrado`);
    }

    return asesor;
  }

  // ──────────────────────────────────────────
  // UPDATE
  // ──────────────────────────────────────────
  async update(id: string, dto: UpdateAsesorDto): Promise<Asesor> {
    const asesor = await this.findOne(id);

    // Si cambia la Persona, verificar que existe y no tenga otro asesor
    if (dto.personaId && dto.personaId !== asesor.persona.id) {
      const persona = await this.personaRepository.findOne({
        where: { id: dto.personaId },
        relations: ['asesor'],
      });

      if (!persona) {
        throw new NotFoundException(
          `Persona con id ${dto.personaId} no encontrada`,
        );
      }

      if (persona.asesor && persona.asesor.id !== id) {
        throw new ConflictException(
          `La persona con id ${dto.personaId} ya tiene un perfil de asesor`,
        );
      }

      asesor.persona = persona;
    }

    // Si cambia el calendarId, verificar que no esté en uso
    if (dto.calendarId && dto.calendarId !== asesor.calendarId) {
      const calendarExistente = await this.asesorRepository.findOne({
        where: { calendarId: dto.calendarId },
      });

      if (calendarExistente) {
        throw new ConflictException(
          `El calendarId "${dto.calendarId}" ya está registrado en otro asesor`,
        );
      }

      asesor.calendarId = dto.calendarId;
    }

    if (dto.disponible !== undefined) {
      asesor.disponible = dto.disponible;
    }

    return this.asesorRepository.save(asesor);
  }

  // ──────────────────────────────────────────
  // DELETE
  // ──────────────────────────────────────────
  async remove(id: string): Promise<{ message: string }> {
    const asesor = await this.findOne(id);
    await this.asesorRepository.remove(asesor);
    return { message: `Asesor con id ${id} eliminado correctamente` };
  }
}