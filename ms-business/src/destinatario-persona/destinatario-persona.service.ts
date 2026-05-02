import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateDestinatarioPersonaDto } from './dto/create-destinatario-persona.dto';
import { UpdateDestinatarioPersonaDto } from './dto/update-destinatario-persona.dto';
import { DestinatarioPersona } from './entities/destinatario-persona.entity';
import { Mensaje } from '../mensaje/entities/mensaje.entity';
import { Persona } from '../persona/entities/persona.entity';

@Injectable()
export class DestinatarioPersonaService {
  constructor(
    @InjectRepository(DestinatarioPersona)
    private readonly destinatarioPersonaRepository: Repository<DestinatarioPersona>,
    @InjectRepository(Mensaje)
    private readonly mensajeRepository: Repository<Mensaje>,
    @InjectRepository(Persona)
    private readonly personaRepository: Repository<Persona>,
  ) {}

  async create(createDestinatarioPersonaDto: CreateDestinatarioPersonaDto) {
    const { mensajeId, personaId, ...rest } = createDestinatarioPersonaDto;

    const mensaje = await this.mensajeRepository.findOne({ where: { id: mensajeId } });
    if (!mensaje) throw new NotFoundException(`Mensaje with ID ${mensajeId} not found`);

    const persona = await this.personaRepository.findOne({ where: { id: personaId } });
    if (!persona) throw new NotFoundException(`Persona with ID ${personaId} not found`);

    const exists = await this.destinatarioPersonaRepository.findOne({
      where: { mensaje: { id: mensajeId }, persona: { id: personaId } }
    });
    if (exists) throw new ConflictException(`DestinatarioPersona combination already exists`);

    const destinatarioPersona = this.destinatarioPersonaRepository.create({
      ...rest,
      mensaje,
      persona,
    });
    return await this.destinatarioPersonaRepository.save(destinatarioPersona);
  }

  async findAll() {
    return await this.destinatarioPersonaRepository.find({
      relations: ['mensaje', 'persona'],
    });
  }

  async findOne(id: string) {
    const destinatarioPersona = await this.destinatarioPersonaRepository.findOne({
      where: { id },
      relations: ['mensaje', 'persona'],
    });
    if (!destinatarioPersona) {
      throw new NotFoundException(`DestinatarioPersona with ID ${id} not found`);
    }
    return destinatarioPersona;
  }

  async update(id: string, updateDestinatarioPersonaDto: UpdateDestinatarioPersonaDto) {
    const destinatarioPersona = await this.findOne(id);
    const { mensajeId, personaId, ...rest } = updateDestinatarioPersonaDto;
    
    Object.assign(destinatarioPersona, rest);

    if (mensajeId) {
      const mensaje = await this.mensajeRepository.findOne({ where: { id: mensajeId } });
      if (!mensaje) throw new NotFoundException(`Mensaje with ID ${mensajeId} not found`);
      destinatarioPersona.mensaje = mensaje;
    }
    
    if (personaId) {
      const persona = await this.personaRepository.findOne({ where: { id: personaId } });
      if (!persona) throw new NotFoundException(`Persona with ID ${personaId} not found`);
      destinatarioPersona.persona = persona;
    }

    if (mensajeId || personaId) {
      const exists = await this.destinatarioPersonaRepository.findOne({
        where: { 
          mensaje: { id: destinatarioPersona.mensaje.id }, 
          persona: { id: destinatarioPersona.persona.id } 
        }
      });
      if (exists && exists.id !== id) {
        throw new ConflictException(`DestinatarioPersona combination already exists`);
      }
    }

    return await this.destinatarioPersonaRepository.save(destinatarioPersona);
  }

  async remove(id: string) {
    const destinatarioPersona = await this.findOne(id);
    return await this.destinatarioPersonaRepository.remove(destinatarioPersona);
  }
}
