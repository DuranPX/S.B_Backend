import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePersonaDto } from './dto/create-persona.dto';
import { UpdatePersonaDto } from './dto/update-persona.dto';
import { Persona } from './entities/persona.entity';

import { Conductor } from '../conductor/entities/conductor.entity';
import { GrupoPersona } from '../grupo-persona/entities/grupo-persona.entity';
import { Mensaje } from '../mensaje/entities/mensaje.entity';

@Injectable()
export class PersonaService {
  constructor(
    @InjectRepository(Persona)
    private readonly personaRepo: Repository<Persona>,
    @InjectRepository(Conductor)
    private readonly conductorRepo: Repository<Conductor>,
    @InjectRepository(GrupoPersona)
    private readonly grupoPersonaRepo: Repository<GrupoPersona>,
    @InjectRepository(Mensaje)
    private readonly mensajeRepo: Repository<Mensaje>,
  ) { }

  async create(dto: CreatePersonaDto, authId: string): Promise<Persona> {
  const existe = await this.personaRepo.findOneBy({ authId });

  if (existe) {
    throw new ConflictException(
      'Ya existe un registro de Persona para este usuario.',
    );
  }

  const payload: Partial<Persona> = {
  authId,
  firstName: dto.firstName,
  lastName: dto.lastName,
  email: dto.email,
  tipoDocumento: dto.tipoDocumento,
  numeroDocumento: dto.numeroDocumento,
  phone: dto.phone,
};

  if (dto.birthDate) {
    payload.birthDate = new Date(dto.birthDate);
  }

  const persona = this.personaRepo.create(payload);

  return await this.personaRepo.save(persona);
}

  // ── READ ALL ───────────────────────────────────────────────────────────────
  findAll(): Promise<Persona[]> {
    return this.personaRepo.find();
  }

  // ── READ ONE ───────────────────────────────────────────────────────────────
  async findOne(id: string): Promise<Persona> {
    const persona = await this.personaRepo.findOneBy({ id });
    if (!persona) {
      throw new NotFoundException(`Persona con id "${id}" no encontrada.`);
    }
    return persona;
  }

  // ── UPDATE ─────────────────────────────────────────────────────────────────
  async update(id: string, dto: UpdatePersonaDto): Promise<Persona> {
    const persona = await this.findOne(id); // lanza NotFoundException si no existe
    const payload = { ...dto } as any;
    if (dto.birthDate) {
      payload.birthDate = new Date(dto.birthDate);
    }
    Object.assign(persona, payload);
    return this.personaRepo.save(persona);
  }

  // ── DELETE ─────────────────────────────────────────────────────────────────
  async remove(id: string) {
    const persona = await this.findOne(id);

    // Validar que NO tenga conductor asociado
    const conductorCount = await this.conductorRepo.count({ where: { persona: { id } } });
    if (conductorCount > 0) {
      throw new ConflictException(`No se puede eliminar la persona "${id}" porque tiene un conductor asociado.`);
    }

    // Validar que NO tenga relaciones en grupo-persona
    const grupoPersonaCount = await this.grupoPersonaRepo.count({ where: { persona: { id } } });
    if (grupoPersonaCount > 0) {
      throw new ConflictException(`No se puede eliminar la persona "${id}" porque está asociada a uno o más grupos.`);
    }

    // Validar que NO tenga mensajes asociados (como emisor)
    const mensajesCount = await this.mensajeRepo.count({ where: { emisor: { id } } });
    if (mensajesCount > 0) {
      throw new ConflictException(`No se puede eliminar la persona "${id}" porque tiene mensajes enviados asociados.`);
    }

    return await this.personaRepo.remove(persona);
  }
}
