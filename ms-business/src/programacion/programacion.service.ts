// src/programacion/programacion.service.ts

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import {
  Programacion,
  EstadoProgramacion,
} from './entities/programacion.entity';

import { CreateProgramacionDto } from './dto/create-programacion.dto';
import { UpdateProgramacionDto } from './dto/update-programacion.dto';

import { Turno } from '../turno/entities/turno.entity';
import { Ruta } from '../ruta/entities/ruta.entity';

@Injectable()
export class ProgramacionService {
  constructor(
    @InjectRepository(Programacion)
    private readonly programacionRepository: Repository<Programacion>,

    @InjectRepository(Turno)
    private readonly turnoRepository: Repository<Turno>,

    @InjectRepository(Ruta)
    private readonly rutaRepository: Repository<Ruta>,
  ) { }


  async findActiveByBus(
    busId: string,
  ) {

    return this
      .programacionRepository
      .findOne({

        where: {
          bus: {
            id: busId
          } as any,

          estado:
            EstadoProgramacion
              .EN_CURSO,
        },

        relations: [
          'ruta',
          'bus',
        ],
      });
  }
  // =========================================================
  // HELPERS
  // =========================================================

  private convertirHoraAMinutos(hora: string): number {
    if (!hora || typeof hora !== 'string') {
      throw new BadRequestException('Hora inválida');
    }

    const partes = hora.split(':');

    if (partes.length < 2) {
      throw new BadRequestException(
        'Formato de hora inválido',
      );
    }

    const [h, m] = partes.map(Number);

    if (isNaN(h) || isNaN(m)) {
      throw new BadRequestException(
        'Hora inválida',
      );
    }

    return h * 60 + m;
  }

  // =========================================================
  // CREATE
  // =========================================================

  async create(
    createProgramacionDto: CreateProgramacionDto,
  ): Promise<Programacion> {
    try {
      const {
        ruta_id,
        bus_id,
        fecha,
        hora_salida,
        tolerancia_minutos = 0,
        ...rest
      } = createProgramacionDto;

      // =====================================================
      // VALIDACIONES BÁSICAS
      // =====================================================

      if (!ruta_id) {
        throw new BadRequestException(
          'La ruta es obligatoria',
        );
      }

      if (!bus_id) {
        throw new BadRequestException(
          'El bus es obligatorio',
        );
      }

      if (!fecha) {
        throw new BadRequestException(
          'La fecha es obligatoria',
        );
      }

      if (!hora_salida) {
        throw new BadRequestException(
          'La hora de salida es obligatoria',
        );
      }

      // =====================================================
      // VALIDAR RUTA
      // =====================================================

      const nuevaRuta = await this.rutaRepository.findOne({
        where: { id: ruta_id },
      });

      if (!nuevaRuta) {
        throw new NotFoundException(
          `Ruta con id ${ruta_id} no encontrada`,
        );
      }

      // =====================================================
      // VALIDAR HORA
      // =====================================================

      const nuevaHoraMin =
        this.convertirHoraAMinutos(hora_salida);

      const inicioNueva =
        nuevaHoraMin - tolerancia_minutos;

      const finNueva =
        nuevaHoraMin +
        (nuevaRuta.tiempo_estimado_total ?? 0) +
        tolerancia_minutos;

      // =====================================================
      // VALIDAR CONFLICTOS DE HORARIO
      // =====================================================

      const programacionesBus =
        await this.programacionRepository.find({
          where: {
            bus: { id: bus_id } as any,
            fecha: fecha as any,
          },
          relations: ['ruta'],
        });

      for (const prog of programacionesBus) {
        // Ignorar programaciones finalizadas
        if (
          prog.estado ===
          EstadoProgramacion.FINALIZADO
        ) {
          continue;
        }

        // Protección null
        if (!prog.ruta) {
          continue;
        }

        if (!prog.hora_salida) {
          continue;
        }

        const horaExistenteMin =
          this.convertirHoraAMinutos(
            prog.hora_salida,
          );

        const toleranciaExistente =
          prog.tolerancia_minutos ?? 0;

        const inicioExistente =
          horaExistenteMin -
          toleranciaExistente;

        const finExistente =
          horaExistenteMin +
          (prog.ruta.tiempo_estimado_total ??
            0) +
          toleranciaExistente;

        const hayCruce =
          inicioNueva < finExistente &&
          finNueva > inicioExistente;

        if (hayCruce) {
          throw new BadRequestException(
            'El bus ya tiene una programación que se cruza con este horario',
          );
        }
      }

      // =====================================================
      // VALIDAR TURNOS
      // =====================================================

      const turnos =
        await this.turnoRepository.find({
          where: {
            bus: { id: bus_id } as any,
          },
        });

      const fechaHoraProgramacion = new Date(
        `${fecha}T${hora_salida}:00`,
      );

      const turnoValido = turnos.some(
        (turno: any) => {

          if (
            !turno.fecha_inicio_programada ||
            !turno.fecha_fin_programada
          ) {
            return false;
          }

          const inicioTurno = new Date(
            turno.fecha_inicio_programada,
          );

          const finTurno = new Date(
            turno.fecha_fin_programada,
          );

          return (
            fechaHoraProgramacion >= inicioTurno &&
            fechaHoraProgramacion <= finTurno
          );
        },
      );

      if (!turnoValido) {
        throw new BadRequestException(
          'El bus no tiene un conductor asignado para ese horario',
        );
      }

      // =====================================================
      // CREAR PROGRAMACIÓN
      // =====================================================

      const programacion =
        this.programacionRepository.create({
          ...rest,
          fecha,
          hora_salida,
          tolerancia_minutos,
          ruta: { id: ruta_id } as any,
          bus: { id: bus_id } as any,
        });

      return await this.programacionRepository.save(
        programacion,
      );
    } catch (error) {
      // Re-lanzar errores HTTP conocidos
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      console.error(
        'Error creando programación:',
        error,
      );

      throw new InternalServerErrorException(
        'Error interno al crear la programación',
      );
    }
  }

  // =========================================================
  // FIND ALL
  // =========================================================

  async findAll(): Promise<Programacion[]> {
    try {
      return await this.programacionRepository.find({
        relations: ['ruta', 'bus'],
      });
    } catch (error) {
      console.error(error);

      throw new InternalServerErrorException(
        'Error obteniendo programaciones',
      );
    }
  }

  // =========================================================
  // FIND ONE
  // =========================================================

  async findOne(id: string): Promise<Programacion> {
    try {
      if (!id) {
        throw new BadRequestException(
          'El id es obligatorio',
        );
      }

      const programacion =
        await this.programacionRepository.findOne({
          where: { id },
          relations: ['ruta', 'bus'],
        });

      if (!programacion) {
        throw new NotFoundException(
          `Programacion con id ${id} no encontrada`,
        );
      }

      return programacion;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      console.error(error);

      throw new InternalServerErrorException(
        'Error obteniendo programación',
      );
    }
  }

  // =========================================================
  // INCREMENTAR PASAJERO
  // =========================================================

  async incrementarPasajero(
    id: string,
  ): Promise<void> {
    try {
      const programacion =
        await this.findOne(id);

      if (
        programacion.estado !==
        EstadoProgramacion.PROGRAMADO
      ) {
        throw new BadRequestException(
          'La programación no está en estado Programado',
        );
      }

      await this.programacionRepository.increment(
        { id },
        'pasajeros_actuales',
        1,
      );
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      console.error(error);

      throw new InternalServerErrorException(
        'Error incrementando pasajeros',
      );
    }
  }

  // =========================================================
  // UPDATE
  // =========================================================

  async update(
    id: string,
    updateProgramacionDto: UpdateProgramacionDto,
  ): Promise<Programacion> {
    try {
      const programacion =
        await this.findOne(id);

      const {
        ruta_id,
        bus_id,
        ...rest
      } = updateProgramacionDto;

      if (ruta_id) {
        const ruta =
          await this.rutaRepository.findOne({
            where: { id: ruta_id },
          });

        if (!ruta) {
          throw new NotFoundException(
            `Ruta con id ${ruta_id} no encontrada`,
          );
        }

        programacion.ruta = {
          id: ruta_id,
        } as any;
      }

      if (bus_id) {
        programacion.bus = {
          id: bus_id,
        } as any;
      }

      Object.assign(programacion, rest);

      return await this.programacionRepository.save(
        programacion,
      );
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      console.error(error);

      throw new InternalServerErrorException(
        'Error actualizando programación',
      );
    }
  }

  // =========================================================
  // REMOVE
  // =========================================================

  async remove(id: string): Promise<void> {
    try {
      const programacion =
        await this.findOne(id);

      if (
        programacion.estado !==
        EstadoProgramacion.PROGRAMADO
      ) {
        throw new BadRequestException(
          'Solo se pueden eliminar programaciones en estado Programado',
        );
      }

      await this.programacionRepository.remove(
        programacion,
      );
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      console.error(error);

      throw new InternalServerErrorException(
        'Error eliminando programación',
      );
    }
  }
}