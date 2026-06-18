import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsEnum,
  IsUUID,
  IsNumber,
  MaxLength,
  Min,
  Max,
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

  // Ubicación opcional adjunta al mensaje. Ambas deben venir juntas o
  // ninguna (no se valida la pareja aquí por simplicidad; el frontend
  // siempre las manda juntas).
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  ubicacionLat?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  ubicacionLng?: number;
}