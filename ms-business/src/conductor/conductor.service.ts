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
import { Turno } from '../turno/entities/turno.entity';

import { PersonaService } from '../persona/persona.service';

@Injectable()
export class ConductorService {
  constructor(
    @InjectRepository(Conductor)
    private readonly conductorRepo: Repository<Conductor>,

    @InjectRepository(Empresa)
    private readonly empresaRepo: Repository<Empresa>,

    @InjectRepository(Turno)
    private readonly turnoRepo: Repository<Turno>,

    private readonly personaService: PersonaService,
  ) {}

  // ─────────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────────

  private async validarLicenciaUnica(
    licencia: string,
    excludeId?: string,
  ): Promise<void> {
    const existente = await this.conductorRepo.findOne({
      where: { licencia },
    });

    if (existente && existente.id !== excludeId) {
      throw new ConflictException(
        `Ya existe un conductor registrado con la licencia "${licencia}".`,
      );
    }
  }

  // ─────────────────────────────────────────────────────────────
  // CREATE
  // ─────────────────────────────────────────────────────────────

  async create(dto: CreateConductorDto): Promise<Conductor> {
    // 1. Validar persona existente
    const persona = await this.personaService.findOne(dto.personaId);

    // 2. Validar relación 1:1 persona -> conductor
    const existeConductor = await this.conductorRepo.findOne({
      where: {
        persona: {
          id: dto.personaId,
        },
      },
    });

    if (existeConductor) {
      throw new ConflictException(
        `La persona con id "${dto.personaId}" ya está registrada como conductor.`,
      );
    }

    // 3. Validar licencia única
    await this.validarLicenciaUnica(dto.licencia);

    // 4. Empresas opcionales
    let empresas: Empresa[] = [];

    if (dto.empresaId) {
      const empresa = await this.empresaRepo.findOneBy({
        id: dto.empresaId,
      });

      if (!empresa) {
        throw new NotFoundException(
          `Empresa con id "${dto.empresaId}" no encontrada.`,
        );
      }

      empresas = [empresa];
    }

    // 5. Crear conductor
    const conductor = this.conductorRepo.create({
      licencia: dto.licencia,
      activo: dto.activo ?? true,
      persona,
      empresas,
    });

    try {
      const saved = await this.conductorRepo.save(conductor);

      return this.findOne(saved.id);
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY' || err.code === '23505') {
        throw new ConflictException(
          `Ya existe un conductor con esa licencia o persona (constraint de BD).`,
        );
      }

      throw err;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // FIND ALL
  // ─────────────────────────────────────────────────────────────

  findAll(): Promise<Conductor[]> {
    return this.conductorRepo.find({
      relations: [
        'persona',
        'empresas',
        'turnos',
      ],
    });
  }

  // ─────────────────────────────────────────────────────────────
  // FIND ONE
  // ─────────────────────────────────────────────────────────────

  async findOne(id: string): Promise<Conductor> {
    const conductor = await this.conductorRepo.findOne({
      where: { id },

      relations: [
        'persona',
        'empresas',
        'turnos',
        'turnos.bus',
      ],
    });

    if (!conductor) {
      throw new NotFoundException(
        `Conductor con id "${id}" no encontrado.`,
      );
    }

    return conductor;
  }

  // ─────────────────────────────────────────────────────────────
  // UPDATE
  // ─────────────────────────────────────────────────────────────

  async update(
    id: string,
    dto: UpdateConductorDto,
  ): Promise<Conductor> {
    const conductor = await this.findOne(id);

    // ── Licencia ─────────────────────────────────────────────

    if (
      dto.licencia !== undefined &&
      dto.licencia !== conductor.licencia
    ) {
      await this.validarLicenciaUnica(dto.licencia, id);

      conductor.licencia = dto.licencia;
    }

    // ── Estado activo ────────────────────────────────────────

    if (dto.activo !== undefined) {
      conductor.activo = dto.activo;
    }

    // ── Empresas ─────────────────────────────────────────────

    if (dto.empresasIds !== undefined) {
      const empresas = await this.empresaRepo.findByIds(
        dto.empresasIds,
      );

      if (
        dto.empresasIds.length > 0 &&
        empresas.length === 0
      ) {
        throw new NotFoundException(
          'No se encontraron empresas con los IDs proporcionados.',
        );
      }

      conductor.empresas = empresas;
    }

    try {
      // Guardar conductor base
      const savedConductor =
        await this.conductorRepo.save(conductor);

      // ─────────────────────────────────────────────────────
      // TURNOS
      // ─────────────────────────────────────────────────────

      /**
       * IMPORTANTE:
       * Si turnosIds viene vacío [] también debe limpiar.
       */
      if (dto.turnosIds !== undefined) {

        // 1. Buscar turnos actualmente asociados
        const turnosActuales = await this.turnoRepo.find({
          where: {
            conductor: {
              id,
            },
          },
          relations: ['conductor'],
        });

        // 2. Desasociar TODOS los turnos previos
        for (const turno of turnosActuales) {
          turno.conductor = null;
        }

        if (turnosActuales.length > 0) {
          await this.turnoRepo.save(turnosActuales);
        }

        // 3. Asociar nuevos turnos
        if (dto.turnosIds.length > 0) {

          const nuevosTurnos =
            await this.turnoRepo.findByIds(dto.turnosIds);

          if (nuevosTurnos.length !== dto.turnosIds.length) {
            throw new NotFoundException(
              'Uno o más turnos no existen.',
            );
          }

          for (const turno of nuevosTurnos) {
            turno.conductor = savedConductor;
          }

          await this.turnoRepo.save(nuevosTurnos);
        }
      }

      // 4. Retornar entidad completamente refrescada
      return this.findOne(id);

    } catch (err) {

      if (err.code === 'ER_DUP_ENTRY' || err.code === '23505') {
        throw new ConflictException(
          `Ya existe un conductor con esa licencia (constraint de BD).`,
        );
      }

      throw err;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // REMOVE
  // ─────────────────────────────────────────────────────────────

  async remove(id: string) {
    const conductor = await this.findOne(id);

    const turnosCount = await this.turnoRepo.count({
      where: {
        conductor: {
          id,
        },
      },
    });

    if (turnosCount > 0) {
      throw new ConflictException(
        `No se puede eliminar el conductor "${id}" porque tiene ${turnosCount} turno(s) asociado(s).`,
      );
    }

    return this.conductorRepo.remove(conductor);
  }
}