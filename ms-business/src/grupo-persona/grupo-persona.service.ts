import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateGrupoPersonaDto } from './dto/create-grupo-persona.dto';
import { UpdateGrupoPersonaDto } from './dto/update-grupo-persona.dto';
import { GrupoPersona } from './entities/grupo-persona.entity';
import { Persona } from '../persona/entities/persona.entity';
import { Grupo } from '../grupo/entities/grupo.entity';

@Injectable()
export class GrupoPersonaService {
  constructor(
    @InjectRepository(GrupoPersona)
    private readonly grupoPersonaRepository: Repository<GrupoPersona>,
    @InjectRepository(Persona)
    private readonly personaRepository: Repository<Persona>,
    @InjectRepository(Grupo)
    private readonly grupoRepository: Repository<Grupo>,
  ) {}

  async create(createGrupoPersonaDto: CreateGrupoPersonaDto) {
    const { personaId, grupoId } = createGrupoPersonaDto;

    const persona = await this.personaRepository.findOne({ where: { id: personaId } });
    if (!persona) throw new NotFoundException(`Persona with ID ${personaId} not found`);

    const grupo = await this.grupoRepository.findOne({ where: { id: grupoId } });
    if (!grupo) throw new NotFoundException(`Grupo with ID ${grupoId} not found`);

    const exists = await this.grupoPersonaRepository.findOne({
      where: { persona: { id: personaId }, grupo: { id: grupoId } }
    });
    if (exists) throw new ConflictException(`GrupoPersona combination already exists`);

    const grupoPersona = this.grupoPersonaRepository.create({
      persona,
      grupo,
    });
    return await this.grupoPersonaRepository.save(grupoPersona);
  }

  async findAll() {
    return await this.grupoPersonaRepository.find({
      relations: ['persona', 'grupo'],
    });
  }

  async findOne(id: string) {
    const grupoPersona = await this.grupoPersonaRepository.findOne({
      where: { id },
      relations: ['persona', 'grupo'],
    });
    if (!grupoPersona) {
      throw new NotFoundException(`GrupoPersona with ID ${id} not found`);
    }
    return grupoPersona;
  }

  async update(id: string, updateGrupoPersonaDto: UpdateGrupoPersonaDto) {
    const grupoPersona = await this.findOne(id);
    const { personaId, grupoId } = updateGrupoPersonaDto;
    
    if (personaId) {
      const persona = await this.personaRepository.findOne({ where: { id: personaId } });
      if (!persona) throw new NotFoundException(`Persona with ID ${personaId} not found`);
      grupoPersona.persona = persona;
    }
    
    if (grupoId) {
      const grupo = await this.grupoRepository.findOne({ where: { id: grupoId } });
      if (!grupo) throw new NotFoundException(`Grupo with ID ${grupoId} not found`);
      grupoPersona.grupo = grupo;
    }

    if (personaId || grupoId) {
      const exists = await this.grupoPersonaRepository.findOne({
        where: { 
          persona: { id: grupoPersona.persona.id }, 
          grupo: { id: (grupoPersona.grupo as any).id } 
        }
      });
      if (exists && exists.id !== id) {
        throw new ConflictException(`GrupoPersona combination already exists`);
      }
    }

    return await this.grupoPersonaRepository.save(grupoPersona);
  }

  async remove(id: string) {
    const grupoPersona = await this.findOne(id);
    return await this.grupoPersonaRepository.remove(grupoPersona);
  }
}
