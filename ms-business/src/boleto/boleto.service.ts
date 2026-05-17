import {
  Injectable,
  NotFoundException,
  ConflictException,
  NotAcceptableException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Boleto, EstadoBoleto } from './entities/boleto.entity';
import { Programacion, EstadoProgramacion } from '../programacion/entities/programacion.entity';
import { MetodoPagoCiudadano } from '../metodo-pago-ciudadano/entities/metodo-pago-ciudadano.entity';
import { Historial, TipoHistorial } from '../historial/entities/historial.entity';
import { Persona } from '../persona/entities/persona.entity';
import { UpdateBoletoDto } from './dto/update-boleto.dto';
import { CrearAbordajeDto } from './dto/crear-abordaje.dto';
import { RegistrarDescensoDto } from './dto/registrar-descenso.dto';

@Injectable()
export class BoletoService {
  constructor(
    @InjectRepository(Boleto)
    private readonly boletoRepository: Repository<Boleto>,
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // HU-003: Abordaje Transaccional con Lock Pesimista
  async procesarAbordaje(authId: string, dto: CrearAbordajeDto): Promise<any> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 0. Obtener ciudadano desde la Persona autenticada
      const persona = await queryRunner.manager.findOne(Persona, {
        where: { authId },
        relations: ['ciudadano'],
      });

      if (!persona || !persona.ciudadano) {
        throw new BadRequestException('Ciudadano no encontrado o no sincronizado');
      }
      const ciudadanoId = persona.ciudadano.id;

      // 1. Lock Programacion & Bus
      const programacion = await queryRunner.manager.createQueryBuilder(Programacion, 'p')
        .setLock('pessimistic_write')
        .innerJoinAndSelect('p.bus', 'bus')
        .innerJoinAndSelect('p.ruta', 'ruta')
        .where('p.id = :id', { id: dto.programacionId })
        .getOne();

      if (!programacion || programacion.estado !== EstadoProgramacion.PROGRAMADO) {
         throw new BadRequestException('Programación inválida o no está en curso');
      }

      if (programacion.pasajeros_actuales >= (programacion.bus.capacidad_total || 0)) {
         throw new ConflictException('Bus capacity reached');
      }

      // 2. Prevenir doble abordaje
      const boletoExistente = await queryRunner.manager.findOne(Boleto, {
        where: { 
          programacion: { id: dto.programacionId }, 
          ciudadano: { id: ciudadanoId }, 
          estado: EstadoBoleto.ACTIVO 
        }
      });
      if (boletoExistente) throw new ConflictException('Active ticket already exists for this trip');

      // 3. Lock Metodo Pago y Validar Saldo
      const metodoPago = await queryRunner.manager.createQueryBuilder(MetodoPagoCiudadano, 'mp')
        .setLock('pessimistic_write')
        .where('mp.id = :id AND mp.ciudadano_id = :cid', { id: dto.metodoPagoId, cid: ciudadanoId })
        .getOne();

      if (!metodoPago) {
        throw new NotFoundException('Método de pago no encontrado o no pertenece al usuario');
      }

      const tarifa = programacion.ruta.tarifa;
      if (Number(metodoPago.saldo) < Number(tarifa)) {
         throw new NotAcceptableException('Insufficient balance');
      }

      // 4. Operaciones atómicas
      metodoPago.saldo = Number(metodoPago.saldo) - Number(tarifa);
      programacion.pasajeros_actuales += 1;

      const boleto = queryRunner.manager.create(Boleto, {
        ciudadano: { id: ciudadanoId } as any,
        programacion: { id: dto.programacionId } as any,
        metodoPagoCiudadano: { id: dto.metodoPagoId } as any,
        paraderoAbordaje: { id: dto.paraderoId } as any,
        monto_pagado: tarifa,
        hora_abordaje: new Date(),
        estado: EstadoBoleto.ACTIVO
      });

      await queryRunner.manager.save(metodoPago);
      await queryRunner.manager.save(programacion);
      const savedBoleto = await queryRunner.manager.save(boleto);

      // 5. Auditoría
      const historial = queryRunner.manager.create(Historial, {
        tipo: TipoHistorial.VIAJE,
        monto: tarifa,
        boleto_id: savedBoleto.id,
        ciudadano_id: ciudadanoId,
        referencia_externa: `Compra boleto programacion ${programacion.id}`
      });
      await queryRunner.manager.save(historial);

      await queryRunner.commitTransaction();

      // Emitir eventos
      this.eventEmitter.emit('ticket.validated', { boletoId: savedBoleto.id, authId, ciudadanoId });
      this.eventEmitter.emit('bus.capacity_updated', { 
        programacionId: programacion.id, 
        capacidad: programacion.pasajeros_actuales,
        routeId: programacion.ruta.id,
        busId: programacion.bus.id
      });

      return {
        id: savedBoleto.id, 
        estado: savedBoleto.estado, 
        montoCobrado: tarifa, 
        saldoRestante: metodoPago.saldo, 
        busId: programacion.bus.id
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  // HU-004: Descenso Transaccional
  async registrarDescenso(boletoId: string, authId: string, dto: RegistrarDescensoDto): Promise<any> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Validar que el boleto sea del usuario
      const persona = await queryRunner.manager.findOne(Persona, { where: { authId }, relations: ['ciudadano'] });
      if (!persona || !persona.ciudadano) throw new BadRequestException('Usuario no válido');

      const boleto = await queryRunner.manager.createQueryBuilder(Boleto, 'b')
        .setLock('pessimistic_write')
        .innerJoinAndSelect('b.programacion', 'prog')
        .innerJoinAndSelect('prog.bus', 'bus')
        .where('b.id = :id AND b.ciudadano_id = :cid', { id: boletoId, cid: persona.ciudadano.id })
        .getOne();

      if (!boleto) throw new NotFoundException('Boleto no encontrado');
      if (boleto.estado !== EstadoBoleto.ACTIVO) throw new ConflictException('El boleto no está activo');

      // Actualizar Boleto
      boleto.estado = EstadoBoleto.COMPLETADO;
      boleto.paraderoDescenso = { id: dto.paraderoDescensoId } as any;
      boleto.hora_descenso = new Date();
      await queryRunner.manager.save(boleto);

      // Liberar cupo en la Programacion
      const programacion = await queryRunner.manager.createQueryBuilder(Programacion, 'p')
        .setLock('pessimistic_write')
        .where('p.id = :id', { id: boleto.programacion?.id })
        .getOne();
      
      if (programacion) {
        programacion.pasajeros_actuales = Math.max(0, programacion.pasajeros_actuales - 1);
        await queryRunner.manager.save(programacion);
      }

      await queryRunner.commitTransaction();

      // Emitir Eventos
      this.eventEmitter.emit('ticket.descended', { 
        boletoId: boleto.id, 
        authId, 
        busId: boleto.programacion?.bus?.id 
      });
      if (programacion) {
        this.eventEmitter.emit('bus.capacity_updated', { 
          programacionId: programacion.id, 
          capacidad: programacion.pasajeros_actuales,
          busId: boleto.programacion?.bus?.id
        });
      }

      return { message: 'Descenso registrado exitosamente', boletoId: boleto.id };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(): Promise<Boleto[]> {
    return await this.boletoRepository.find({
      relations: ['ciudadano', 'programacion', 'metodoPagoCiudadano', 'paraderoAbordaje', 'paraderoDescenso'],
    });
  }

  async findOne(id: string): Promise<Boleto> {
    const boleto = await this.boletoRepository.findOne({
      where: { id },
      relations: ['ciudadano', 'programacion', 'metodoPagoCiudadano', 'paraderoAbordaje', 'paraderoDescenso'],
    });

    if (!boleto) {
      throw new NotFoundException(`Boleto con id ${id} no encontrado`);
    }

    return boleto;
  }

  async cancelar(id: string): Promise<Boleto> {
    const boleto = await this.findOne(id);
    if (boleto.estado !== EstadoBoleto.ACTIVO) {
      throw new BadRequestException('Solo se pueden cancelar boletos en estado Activo');
    }
    boleto.estado = EstadoBoleto.CANCELADO;
    return await this.boletoRepository.save(boleto);
  }

  async update(id: string, updateBoletoDto: UpdateBoletoDto): Promise<Boleto> {
    const boleto = await this.findOne(id);
    Object.assign(boleto, updateBoletoDto);
    return await this.boletoRepository.save(boleto);
  }

  async remove(id: string): Promise<void> {
    const boleto = await this.findOne(id);
    if (boleto.estado === EstadoBoleto.COMPLETADO) {
      throw new BadRequestException('No se pueden eliminar boletos completados');
    }
    await this.boletoRepository.remove(boleto);
  }

  async findOneDetallado(id: string) {
    const boleto = await this.boletoRepository.findOne({
      where: { id },
      relations: [
        'ciudadano',
        'ciudadano.persona',
        'programacion',
        'programacion.bus',
        'programacion.bus.gps',
        'programacion.turno',
        'programacion.turno.conductor',
        'programacion.turno.conductor.persona',
        'paraderoAbordaje',
        'paraderoDescenso',
        'metodoPagoCiudadano',
      ],
    });

    if (!boleto) {
      throw new NotFoundException(`Boleto con id ${id} no encontrado`);
    }

    return boleto;
  }
}
