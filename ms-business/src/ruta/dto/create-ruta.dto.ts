// src/ruta/dto/create-ruta.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsPositive,
  Min,
} from 'class-validator';

export class CreateRutaDto {
  @IsNotEmpty()
  @IsString()
  codigo: string;

  @IsNotEmpty()
  @IsString()
  nombre: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  tarifa: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  tiempo_estimado_total?: number;

  @IsOptional()
  @IsBoolean()
  estado?: boolean;
}