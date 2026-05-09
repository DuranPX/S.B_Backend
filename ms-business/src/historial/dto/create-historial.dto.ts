// src/historial/dto/create-historial.dto.ts
import {
  IsNotEmpty,
  IsUUID,
  IsNumber,
  IsOptional,
  IsPositive,
  IsEnum,
  IsString,
} from 'class-validator';
import { TipoHistorial } from '../entities/historial.entity';

export class CreateHistorialDto {
  @IsNotEmpty()
  @IsEnum(TipoHistorial)
  tipo: TipoHistorial;

  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  monto: number;

  @IsOptional()
  @IsString()
  referencia_externa?: string;

  @IsOptional()
  @IsUUID()
  boleto_id?: string;
}