import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateMensajeDto } from './dto/create-mensaje.dto';
import { UpdateMensajeDto } from './dto/update-mensaje.dto';
import { Mensaje } from './entities/mensaje.entity';
import { Persona } from '../persona/entities/persona.entity';
import { DestinatarioPersona } from '../destinatario-persona/entities/destinatario-persona.entity';
import { DestinatarioGrupo } from '../destinatario-grupo/entities/destinatario-grupo.entity';
import { Grupo } from '../grupo/entities/grupo.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class MensajeService {
  constructor(
    @InjectRepository(Mensaje)
    private readonly mensajeRepository: Repository<Mensaje>,
    @InjectRepository(Persona)
    private readonly personaRepository: Repository<Persona>,
    @InjectRepository(DestinatarioPersona)
    private readonly destPersonaRepository: Repository<DestinatarioPersona>,
    @InjectRepository(DestinatarioGrupo)
    private readonly destGrupoRepository: Repository<DestinatarioGrupo>,
    @InjectRepository(Grupo)
    private readonly grupoRepository: Repository<Grupo>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(createMensajeDto: CreateMensajeDto) {
    const { emisorId, destinatarioPersonaId, destinatarioGrupoId, ...rest } = createMensajeDto as any;

    const emisor = await this.personaRepository.findOne({ where: { id: emisorId } });
    if (!emisor) throw new NotFoundException(`Emisor ${emisorId} no encontrado`);

    // ANTES — create({...rest, emisor, fechaEnvio: new Date()}) devuelve Mensaje[]
    // DESPUÉS — create() vacío y asignar campos manualmente
    const mensaje = this.mensajeRepository.create();
    Object.assign(mensaje, rest);
    mensaje.emisor = emisor;
    mensaje.fechaEnvio = new Date();

    const saved: Mensaje = await this.mensajeRepository.save(mensaje);

    // Enviar a persona individual
    if (destinatarioPersonaId) {
      const destinatario = await this.personaRepository.findOne({ where: { id: destinatarioPersonaId } });
      if (destinatario) {
        const dest = this.destPersonaRepository.create();
        dest.mensaje = saved;
        dest.persona = destinatario;
        dest.leido = false;
        await this.destPersonaRepository.save(dest);

        this.eventEmitter.emit('mensaje.nuevo', {
          authId: destinatario.authId,
          mensajeId: saved.id,
          emisorNombre: `${emisor.firstName} ${emisor.lastName}`,
          preview: saved.contenido.substring(0, 60),
        });
      }
    }

    // Enviar a grupo
    if (destinatarioGrupoId) {
      const grupo = await this.grupoRepository.findOne({
        where: { id: destinatarioGrupoId },
        relations: ['grupoPersonas', 'grupoPersonas.persona'],
      });
      if (grupo) {
        const dest = this.destGrupoRepository.create();
        dest.mensaje = saved;
        dest.grupo = grupo;
        await this.destGrupoRepository.save(dest);

        this.eventEmitter.emit('mensaje.grupo', {
          grupoId: destinatarioGrupoId,
          nombreGrupo: grupo.nombre,
          mensajeId: saved.id,
          emisorNombre: `${emisor.firstName} ${emisor.lastName}`,
          preview: saved.contenido.substring(0, 60),
          miembros: grupo.grupoPersonas?.map(gp => gp.persona?.authId).filter(Boolean) || [],
        });
      }
    }

    return saved;
  }

  // Bandeja de entrada — HU-007
  async getBandejaEntrada(authId: string, filtros?: { soloNoLeidos?: boolean; tipo?: string }) {
    const persona = await this.personaRepository.findOne({ where: { authId } });
    if (!persona) return [];

    // Mensajes individuales
    const qIndividual = this.destPersonaRepository
      .createQueryBuilder('dp')
      .innerJoinAndSelect('dp.mensaje', 'mensaje')
      .innerJoinAndSelect('mensaje.emisor', 'emisor')
      .where('dp.persona_id = :personaId', { personaId: persona.id });

    if (filtros?.soloNoLeidos) qIndividual.andWhere('dp.leido = false');

    const individuales = await qIndividual.orderBy('mensaje.fechaEnvio', 'DESC').getMany();

    // Mensajes de grupos donde es miembro
    const qGrupo = this.destGrupoRepository
      .createQueryBuilder('dg')
      .innerJoinAndSelect('dg.mensaje', 'mensaje')
      .innerJoinAndSelect('mensaje.emisor', 'emisor')
      .innerJoinAndSelect('dg.grupo', 'grupo')
      .innerJoin('grupo_persona', 'gp', 'gp.grupo_id = grupo.id AND gp.persona_id = :personaId', { personaId: persona.id });

    const grupales = await qGrupo.orderBy('mensaje.fechaEnvio', 'DESC').getMany();

    const resultado = [
      ...individuales.map(dp => ({
        id: dp.id,
        tipo: 'individual',
        leido: dp.leido,
        mensaje: dp.mensaje,
        emisor: dp.mensaje.emisor,
        fechaEnvio: dp.mensaje.fechaEnvio,
        destPersonaId: dp.id,
      })),
      ...grupales.map(dg => ({
        id: dg.id,
        tipo: 'grupal',
        leido: false, // los mensajes grupales siempre se consideran no leídos aquí
        mensaje: dg.mensaje,
        emisor: dg.mensaje.emisor,
        grupo: dg.grupo,
        fechaEnvio: dg.mensaje.fechaEnvio,
      })),
    ].sort((a, b) => new Date(b.fechaEnvio).getTime() - new Date(a.fechaEnvio).getTime());

    return resultado;
  }

  // Contar no leídos — para badge
  async countNoLeidos(authId: string): Promise<number> {
    const persona = await this.personaRepository.findOne({ where: { authId } });
    if (!persona) return 0;
    return await this.destPersonaRepository.count({
      where: { persona: { id: persona.id }, leido: false },
    });
  }

  // Marcar como leído — HU-007
  async marcarLeido(destPersonaId: string): Promise<void> {
    await this.destPersonaRepository.update(destPersonaId, { leido: true });
  }

  async findAll() {
    return await this.mensajeRepository.find({ relations: ['emisor'] });
  }

  async findOne(id: string) {
    const mensaje = await this.mensajeRepository.findOne({
      where: { id },
      relations: ['emisor', 'destinatariosPersona', 'destinatariosPersona.persona', 'destinatariosGrupo', 'destinatariosGrupo.grupo'],
    });
    if (!mensaje) throw new NotFoundException(`Mensaje ${id} no encontrado`);
    return mensaje;
  }

    async findSentMessages(personaId: string) {

    const persona = await this.personaRepository.findOne({
      where: { id: personaId }
    });

    if (!persona) {
      throw new NotFoundException(
        `Persona with ID ${personaId} not found`
      );
    }

    return await this.mensajeRepository.find({
      where: {
        emisor: {
          id: personaId,
        },
      },
      relations: [
        'emisor',
        'destinatariosPersona',
        'destinatariosPersona.persona',
      ],
      order: {
        fechaEnvio: 'DESC',
      },
    });
  }

  async update(id: string, updateMensajeDto: UpdateMensajeDto) {
    const mensaje = await this.findOne(id);
    const { emisorId, ...rest } = updateMensajeDto as any;
    Object.assign(mensaje, rest);
    if (emisorId) {
      const emisor = await this.personaRepository.findOne({ where: { id: emisorId } });
      if (!emisor) throw new NotFoundException(`Emisor ${emisorId} no encontrado`);
      mensaje.emisor = emisor;
    }
    return await this.mensajeRepository.save(mensaje);
  }

  async remove(id: string) {
    const mensaje = await this.findOne(id);
    return await this.mensajeRepository.remove(mensaje);
  }
}