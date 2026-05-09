import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  IsEmail,
  IsEnum
} from 'class-validator';
import { TipoDocumento } from '../entities/persona.entity';

export class CreatePersonaDto {
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  firstName: string;

  @IsNotEmpty({ message: 'El apellido es obligatorio' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  lastName: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Matches(/^[0-9+\-() ]*$/, { message: 'El teléfono no es válido' })
  phone?: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsEnum(TipoDocumento)
  tipoDocumento: TipoDocumento;

  @IsNotEmpty()
  @IsString()
  numeroDocumento: string;
}