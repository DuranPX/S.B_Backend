import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsEnum,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { TipoMensaje } from '../entities/mensaje.entity';

export class CreateMensajeDto {
 @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  contenido: string;

  @IsDateString()
  fechaEnvio: Date;

  @IsOptional()
  @IsEnum(TipoMensaje)
  tipo?: TipoMensaje;

  @IsUUID()
  emisorId: string;
}
