// src/paradero/dto/create-paradero.dto.ts
import { IsString, IsNotEmpty, IsNumber, IsBoolean, IsOptional, IsUUID } from 'class-validator';
import { IsValidLatitud, IsValidLongitud } from '../../common/validators/is-valid-coordinate.validator';

export class CreateParaderoDto {
  @IsNotEmpty()
  @IsString()
  codigo: string;

  @IsNotEmpty()
  @IsString()
  nombre: string;

  @IsNotEmpty()
  @IsNumber()
  @IsValidLatitud()
  latitud: number;

  @IsNotEmpty()
  @IsNumber()
  @IsValidLongitud()
  longitud: number;

  @IsOptional()
  @IsString()
  tipo?: string;

  @IsOptional()
  @IsBoolean()
  estado?: boolean;

  @IsNotEmpty()
  @IsUUID()
  nodo_id: string;
}