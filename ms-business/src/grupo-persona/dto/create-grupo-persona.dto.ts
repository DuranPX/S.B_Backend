import { IsUUID } from 'class-validator';

export class CreateGrupoPersonaDto {
  @IsUUID()
  personaId: string;

  @IsUUID()
  grupoId: string;
}
