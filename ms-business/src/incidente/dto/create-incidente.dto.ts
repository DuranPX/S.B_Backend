// src/incidente/dto/create-incidente.dto.ts
import {
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsString,
  IsNumber,
} from 'class-validator';
import {
  TipoIncidente,
  GravedadIncidente,
  EstadoIncidente,
} from '../entities/incidente.entity';
import { IsValidLatitud, IsValidLongitud } from '../../common/validators/is-valid-coordinate.validator';

export class CreateIncidenteDto {
  @IsNotEmpty()
  @IsEnum(TipoIncidente)
  tipo: TipoIncidente;

  @IsNotEmpty()
  @IsEnum(GravedadIncidente)
  gravedad: GravedadIncidente;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsString()
  seguimiento_log?: string;

  @IsOptional()
  @IsEnum(EstadoIncidente)
  estado?: EstadoIncidente;

  @IsNotEmpty()
  @IsNumber()
  @IsValidLatitud()
  latitud: number;

  @IsNotEmpty()
  @IsNumber()
  @IsValidLongitud()
  longitud: number;
}