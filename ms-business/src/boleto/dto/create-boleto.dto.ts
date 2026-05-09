// src/boleto/dto/create-boleto.dto.ts
import {
  IsNotEmpty,
  IsUUID,
  IsNumber,
  IsOptional,
  IsPositive,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { EstadoBoleto } from '../entities/boleto.entity';
import { HasDisponibilidad } from '../../common/validators/has-disponibilidad.validator';

export class CreateBoletoDto {
  @IsNotEmpty()
  @IsUUID()
  ciudadano_id: string;

  @IsNotEmpty()
  @IsUUID()
  @HasDisponibilidad()
  programacion_id: string;

  @IsNotEmpty()
  @IsUUID()
  metodo_pago_id: string;

  @IsNotEmpty()
  @IsUUID()
  paradero_abordaje_id: string;

  @IsNotEmpty()
  @IsUUID()
  paradero_descenso_id: string;

  @IsOptional()
  @IsDateString()
  hora_abordaje?: string;

  @IsOptional()
  @IsDateString()
  hora_descenso?: string;

  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  monto_pagado: number;

  @IsOptional()
  @IsEnum(EstadoBoleto)
  estado?: EstadoBoleto;

  @IsOptional()
  qr_validacion?: string;
}