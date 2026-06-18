import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateDestinatarioPersonaDto } from './dto/create-destinatario-persona.dto';
import { UpdateDestinatarioPersonaDto } from './dto/update-destinatario-persona.dto';
import { DestinatarioPersona } from './entities/destinatario-persona.entity';
import { Mensaje } from '../mensaje/entities/mensaje.entity';
import { Persona } from '../persona/entities/persona.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class DestinatarioPersonaService {
  constructor(
  @InjectRepository(DestinatarioPersona)
  private readonly destinatarioPersonaRepository: Repository<DestinatarioPersona>,

  @InjectRepository(Mensaje)
  private readonly mensajeRepository: Repository<Mensaje>,

  @InjectRepository(Persona)
  private readonly personaRepository: Repository<Persona>,

  private readonly eventEmitter: EventEmitter2,
) {}

  async create(createDestinatarioPersonaDto: CreateDestinatarioPersonaDto) {
    const { mensajeId, personaId, ...rest } = createDestinatarioPersonaDto;

    const mensaje = await this.mensajeRepository.findOne({
      where: { id: mensajeId },
      relations: ['emisor'],
    });
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

    const saved = await this.destinatarioPersonaRepository.save(destinatarioPersona);

    this.eventEmitter.emit('message.received', {
      authId: persona.authId,
      mensajeId: mensaje.id,
      contenido: mensaje.contenido,
      fechaEnvio: mensaje.fechaEnvio,
      emisorId: mensaje.emisor?.id,
      ubicacionLat: mensaje.ubicacionLat,
      ubicacionLng: mensaje.ubicacionLng,
      // Necesario para que el destinatario, al marcar el mensaje como
      // leído desde el frontend, sepa qué fila exacta de DestinatarioPersona
      // actualizar (un mismo mensaje puede tener varios destinatarios).
      destinatarioPersonaId: saved.id,
    });

    return saved;
  }

  async marcarComoLeido(id: string) {
    // Se necesita la relación mensaje.emisor (no solo mensaje) para poder
    // notificar al EMISOR original que su mensaje fue leído — el lector ya
    // lo sabe porque fue quien disparó la acción.
    const destinatarioPersona = await this.destinatarioPersonaRepository.findOne({
      where: { id },
      relations: ['mensaje', 'mensaje.emisor', 'persona'],
    });
    if (!destinatarioPersona) {
      throw new NotFoundException(`DestinatarioPersona with ID ${id} not found`);
    }

    // Si ya estaba marcado como leído, no reemitimos el evento (evita
    // notificar al emisor repetidamente si el destinatario reabre el mensaje).
    if (destinatarioPersona.leido) {
      return destinatarioPersona;
    }

    destinatarioPersona.leido = true;
    destinatarioPersona.fechaLectura = new Date();

    const saved = await this.destinatarioPersonaRepository.save(destinatarioPersona);

    const emisorAuthId = destinatarioPersona.mensaje.emisor?.authId;
    if (emisorAuthId) {
      this.eventEmitter.emit('message.read', {
        mensajeId: destinatarioPersona.mensaje.id,
        fechaLectura: destinatarioPersona.fechaLectura,
        lectorPersonaId: destinatarioPersona.persona.id,
        // authId del EMISOR del mensaje original: es a quien hay que avisar
        // que su mensaje fue leído (no al lector, que ya lo sabe).
        authId: emisorAuthId,
      });
    }

    return saved;
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
