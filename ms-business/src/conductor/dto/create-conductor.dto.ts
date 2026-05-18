import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateConductorDto {
  @IsNotEmpty({ message: 'El ID de la persona es obligatorio' })
  @IsUUID('4', { message: 'El ID de la persona debe ser un UUID válido' })
  personaId: string;

  @IsOptional()
  @IsUUID('4', { message: 'El ID de la empresa debe ser un UUID válido' })
  empresaId?: string;

  @IsNotEmpty({ message: 'La licencia es obligatoria' })
  @IsString()
  @MinLength(5)
  @MaxLength(100)
  licencia: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
