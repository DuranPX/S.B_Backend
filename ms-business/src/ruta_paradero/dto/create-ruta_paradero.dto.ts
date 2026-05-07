// src/ruta-paradero/dto/create-ruta-paradero.dto.ts
import {
  IsNotEmpty,
  IsNumber,
  IsUUID,
  IsInt,
  IsOptional,
  IsPositive,
  Min,
} from 'class-validator';

export class CreateRutaParaderoDto {
  @IsNotEmpty()
  @IsUUID()
  ruta_id: string;

  @IsNotEmpty()
  @IsUUID()
  paradero_id: string;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  orden: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  distancia_desde_anterior?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  tiempo_estimado?: number;
}