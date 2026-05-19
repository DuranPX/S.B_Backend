import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { Turno } from './entities/turno.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class TurnoScheduler {
  constructor(
    @InjectRepository(Turno)
    private readonly turnoRepository: Repository<Turno>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // Ejecuta cada minuto
  @Cron(CronExpression.EVERY_MINUTE)
  async iniciarTurnosProgramados() {
    const ahora = new Date();

    // Buscar turnos PROGRAMADOS cuya hora de inicio ya llegó
    const turnosPendientes = await this.turnoRepository.find({
      where: {
        estado: 'PROGRAMADO',
        fecha_inicio_programada: LessThanOrEqual(ahora),
      },
      relations: ['conductor', 'bus'],
    });

    for (const turno of turnosPendientes) {
      turno.estado = 'EN_CURSO';
      turno.fecha_inicio_real = ahora;
      await this.turnoRepository.save(turno);

      // Notificar al conductor vía WebSocket
      this.eventEmitter.emit('shift.started', {
        turnoId: turno.id,
        conductorId: turno.conductor?.id,
        busId: turno.bus?.id,
        horaInicio: turno.fecha_inicio_real,
        automatico: true,
      });
    }
  }
}