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
  ) { }

  // Ejecuta cada minuto
  @Cron(CronExpression.EVERY_MINUTE)
  async gestionarTurnos() {
    const ahora = new Date();

    /**
     * =========================================
     * FINALIZAR TURNOS EN CURSO
     * =========================================
     */
    const turnosEnCurso = await this.turnoRepository.find({
      where: {
        estado: 'EN_CURSO',
        fecha_fin_programada: LessThanOrEqual(ahora),
      },
      relations: ['conductor', 'bus'],
    });

    for (const turno of turnosEnCurso) {
      turno.estado = 'FINALIZADO';
      turno.fecha_fin_real = ahora;

      await this.turnoRepository.save(turno);

      // Evento WebSocket
      this.eventEmitter.emit('shift.finished', {
        turnoId: turno.id,
        conductorId: turno.conductor?.id,
        busId: turno.bus?.id,
        horaFin: turno.fecha_fin_real,
        automatico: true,
      });
    }

    /**
   * =========================================
   * EXPIRAR TURNOS NO INICIADOS
   * =========================================
   * Si un conductor no inició su turno antes de la hora fin programada,
   * el turno pasa de PROGRAMADO a FINALIZADO automáticamente.
   */
    const turnosPerdidos = await this.turnoRepository.find({
      where: {
        estado: 'PROGRAMADO',
        fecha_fin_programada: LessThanOrEqual(ahora),
      },
      relations: ['conductor', 'bus'],
    });

    for (const turno of turnosPerdidos) {
      turno.estado = 'FINALIZADO';
      turno.fecha_fin_real = turno.fecha_fin_programada;

      await this.turnoRepository.save(turno);

      this.eventEmitter.emit('shift.expired', {
        turnoId: turno.id,
        conductorId: turno.conductor?.id,
        busId: turno.bus?.id,
        automatico: true,
      });
    }
  }
}