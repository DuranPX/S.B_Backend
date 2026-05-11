// src/boleto/boleto.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Boleto, EstadoBoleto } from './entities/boleto.entity';
import { CreateBoletoDto } from './dto/create-boleto.dto';
import { UpdateBoletoDto } from './dto/update-boleto.dto';
import { ProgramacionService } from '../programacion/programacion.service';
import { HistorialService } from '../historial/historial.service';
import { TipoHistorial } from '../historial/entities/historial.entity';

@Injectable()
export class BoletoService {
  constructor(
    @InjectRepository(Boleto)
    private readonly boletoRepository: Repository<Boleto>,
    private readonly programacionService: ProgramacionService,
    private readonly historialService: HistorialService,
  ) { }

  async comprar(createBoletoDto: CreateBoletoDto): Promise<Boleto> {
    const {
      ciudadano_id,
      programacion_id,
      metodo_pago_id,
      paradero_abordaje_id,
      paradero_descenso_id,
      ...rest
    } = createBoletoDto;

    // Verificamos que la programacion existe y tiene cupos
    const programacion = await this.programacionService.findOne(programacion_id);

    // Creamos el boleto
    const boleto = this.boletoRepository.create({
      ...rest,
      ciudadano: { id: ciudadano_id } as any,
      programacion: { id: programacion_id } as any,
      metodoPagoCiudadano: { id: metodo_pago_id } as any,
      paraderoAbordaje: { id: paradero_abordaje_id } as any,
      paraderoDescenso: { id: paradero_descenso_id } as any,
    });

    const boletoGuardado = await this.boletoRepository.save(boleto);

    // Incrementamos el contador de pasajeros en la programacion
    await this.programacionService.incrementarPasajero(programacion_id);

    // Registramos el historial de la compra
    await this.historialService.create({
      tipo: TipoHistorial.VIAJE,
      monto: createBoletoDto.monto_pagado,
      boleto_id: boletoGuardado.id,
      referencia_externa: `Compra boleto programacion ${programacion.id}`,
    });

    return boletoGuardado;
  }

  async findAll(): Promise<Boleto[]> {
    return await this.boletoRepository.find({
      relations: ['ciudadano', 'programacion', 'metodoPago', 'paraderoAbordaje', 'paraderoDescenso'],
    });
  }

  async findOne(id: string): Promise<Boleto> {
    const boleto = await this.boletoRepository.findOne({
      where: { id },
      relations: ['ciudadano', 'programacion', 'metodoPago', 'paraderoAbordaje', 'paraderoDescenso'],
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
    const {
      ciudadano_id,
      programacion_id,
      metodo_pago_id,
      paradero_abordaje_id,
      paradero_descenso_id,
      ...rest
    } = updateBoletoDto;

    if (ciudadano_id) boleto.ciudadano = { id: ciudadano_id } as any;
    if (programacion_id) boleto.programacion = { id: programacion_id } as any;
    if (metodo_pago_id) boleto.metodoPagoCiudadano = { id: metodo_pago_id } as any;
    if (paradero_abordaje_id) boleto.paraderoAbordaje = { id: paradero_abordaje_id } as any;
    if (paradero_descenso_id) boleto.paraderoDescenso = { id: paradero_descenso_id } as any;

    Object.assign(boleto, rest);
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