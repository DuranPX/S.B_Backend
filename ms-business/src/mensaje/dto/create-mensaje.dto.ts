import { IsString, IsNotEmpty, IsDateString, IsOptional, IsEnum, IsUUID } from 'class-validator';

export class CreateMensajeDto {
  @IsString()
  @IsNotEmpty()
  contenido: string;

  @IsDateString()
  fechaEnvio: Date;

  @IsOptional()
  @IsEnum(['PQRS', 'Reporte de Incidentes', 'Mensaje normal'])
  tipo?: string;

  @IsUUID()
  emisorId: string;
}
