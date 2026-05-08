// src/programacion/dto/create-programacion.dto.ts
import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsInt,
  IsEnum,
  IsOptional,
  Min,
  Matches,
} from 'class-validator';
import { TipoRecurrencia, EstadoProgramacion } from '../entities/programacion.entity';
import { IsNotPastDate } from 'src/common/validators/is-not-past-date.validator';

export class CreateProgramacionDto {
  @IsNotEmpty()
  @IsUUID()
  ruta_id: string;

  @IsNotEmpty()
  @IsUUID()
  bus_id: string;

  @IsNotEmpty()
  @IsString()
  @IsNotPastDate()
  fecha: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'hora_salida debe tener formato HH:MM',
  })
  hora_salida: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  tolerancia_minutos?: number;

  @IsNotEmpty()
  @IsEnum(TipoRecurrencia)
  tipo_recurrencia: TipoRecurrencia;

  @IsOptional()
  @IsEnum(EstadoProgramacion)
  estado?: EstadoProgramacion;
}