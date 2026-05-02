import { IsString, IsNotEmpty, IsDateString, IsOptional, IsEnum, IsUUID } from 'class-validator';

export class CreateTurnoDto {
  @IsUUID()
  conductorId: string;

  @IsUUID()
  busId: string;

  @IsDateString()
  fecha_inicio_programada: Date;

  @IsDateString()
  fecha_fin_programada: Date;

  @IsOptional()
  @IsDateString()
  fecha_inicio_real?: Date;

  @IsOptional()
  @IsDateString()
  fecha_fin_real?: Date;

  @IsOptional()
  @IsEnum(['PROGRAMADO', 'EN_CURSO', 'FINALIZADO'])
  estado?: string;

  @IsOptional()
  @IsString()
  observaciones?: string;
}
