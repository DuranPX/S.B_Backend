// src/incidente/incidente.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';        // ← fix 1: import
import { firstValueFrom } from 'rxjs';              // ← fix 1: import
import { CreateIncidenteDto } from './dto/create-incidente.dto';
import { UpdateIncidenteDto } from './dto/update-incidente.dto';
import { Incidente, GravedadIncidente, Comentario } from './entities/incidente.entity';
import { AddComentarioDto } from './dto/add-comentario.dto';

@Injectable()
export class IncidenteService {
  constructor(
    @InjectRepository(Incidente)
    private readonly incidenteRepository: Repository<Incidente>,
    private readonly httpService: HttpService,       // ← fix 1: inyección
  ) {}

  async addComentario(id: string, dto: AddComentarioDto): Promise<Incidente> {
    const incidente = await this.findOne(id);

    const nuevoComentario: Comentario = {
      texto: dto.texto,
      autor: dto.autor,
      fecha: new Date().toISOString(),
    };

    incidente.comentarios = [...(incidente.comentarios ?? []), nuevoComentario];
    return await this.incidenteRepository.save(incidente);
  }

  async create(createIncidenteDto: CreateIncidenteDto): Promise<Incidente> {
    const incidente = this.incidenteRepository.create(createIncidenteDto);
    const saved = await this.incidenteRepository.save(incidente);
    // ← fix 2: ya NO llamamos notificarSupervisor aquí porque no tenemos
    // la placa del bus todavía. Se llama desde incidente-bus.service
    // una vez que ya tenemos el IncidenteBus completo.
    return saved;
  }

  // ← fix 3: era private, ahora es public para que incidente-bus.service lo pueda llamar
  async notificarSupervisor(incidente: Incidente, busPlaca: string): Promise<void> {
    const gravedadesAltas = [GravedadIncidente.ALTO, GravedadIncidente.CRITICO];
    if (!gravedadesAltas.includes(incidente.gravedad)) return;

    try {
      await firstValueFrom(
        this.httpService.post(`${process.env.MS_SECURITY}/api/notify/incident`, {
          tipo: incidente.tipo,
          gravedad: incidente.gravedad,
          descripcion: incidente.descripcion,
          busPlaca,
          fecha: new Date(incidente.fecha_reporte).toLocaleString('es-CO'),
        }),
      );
    } catch (err: any) {
      // No bloqueamos el flujo principal si falla la notificación
      console.warn('No se pudo notificar al supervisor:', err?.message);
    }
  }

  async findAll(): Promise<Incidente[]> {
    return await this.incidenteRepository.find({
      relations: ['incidenteBuses', 'incidenteBuses.bus', 'incidenteBuses.fotos'],
    });
  }

  async findOne(id: string): Promise<Incidente> {
    const incidente = await this.incidenteRepository.findOne({
      where: { id },
      relations: ['incidenteBuses', 'incidenteBuses.bus', 'incidenteBuses.fotos'],
    });

    if (!incidente) {
      throw new NotFoundException(`Incidente con id ${id} no encontrado`);
    }

    return incidente;
  }

  async update(id: string, updateIncidenteDto: UpdateIncidenteDto): Promise<Incidente> {
    const incidente = await this.findOne(id);
    Object.assign(incidente, updateIncidenteDto);
    return await this.incidenteRepository.save(incidente);
  }

  async remove(id: string): Promise<void> {
    const incidente = await this.findOne(id);
    await this.incidenteRepository.remove(incidente);
  }
}