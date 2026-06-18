import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import {
  PqrsCategoria,
  PqrsDepartamento,
  PqrsEstado,
  PqrsTipo,
} from '../entities/pqrs.entity';

export class CreatePqrsDto {
  @IsString()
  @IsNotEmpty()
  radicado: string;

  @IsEnum(PqrsTipo)
  tipo: PqrsTipo;

  @IsEnum(PqrsCategoria)
  categoria: PqrsCategoria;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  descripcion: string;

  @IsEmail()
  @IsNotEmpty()
  emailContacto: string;

  @IsEnum(PqrsEstado)
  @IsOptional()
  estado?: PqrsEstado;

  @IsEnum(PqrsDepartamento)
  departamento: PqrsDepartamento;

  @IsString()
  @IsNotEmpty()
  tiempoEstimado: string;
}

export class UpdatePqrsEstadoDto {
  @IsEnum(PqrsEstado)
  estado: PqrsEstado;

  @IsString()
  @IsOptional()
  respuesta?: string;
}