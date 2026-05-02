import { IsUUID } from 'class-validator';

export class CreateDestinatarioGrupoDto {
  @IsUUID()
  mensajeId: string;

  @IsUUID()
  grupoId: string;
}
