import { IsString, IsNotEmpty, IsDateString, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { TipoMensaje } from '../entities/mensaje.entity';

export class CreateMensajeDto {
  @IsString()
  @IsNotEmpty()
  contenido: string;

  @IsDateString()
  fechaEnvio: Date;

  @IsOptional()
  @IsEnum(TipoMensaje)
  tipo?: TipoMensaje;

  @IsUUID()
  emisorId: string;
}
