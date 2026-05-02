import { IsUUID, IsBoolean, IsOptional } from 'class-validator';

export class CreateDestinatarioPersonaDto {
  @IsUUID()
  mensajeId: string;

  @IsUUID()
  personaId: string;

  @IsOptional()
  @IsBoolean()
  leido?: boolean;
}
