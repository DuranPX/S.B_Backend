import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsUUID,
} from 'class-validator';

export class CreateAsesorDto {
  /**
   * UUID de la Persona ya existente en ms-business.
   * Esa Persona debe tener rol "asesor" asignado en ms-security.
   */
  @IsUUID()
  @IsNotEmpty()
  personaId: string;

  /**
   * Email de Google del asesor = su calendarId primario.
   * Ej: "juan.perez@empresa.com"
   */
  @IsEmail()
  @IsNotEmpty()
  calendarId: string;

  /**
   * Disponibilidad inicial. Por defecto true si no se envía.
   */
  @IsBoolean()
  @IsOptional()
  disponible?: boolean;
}