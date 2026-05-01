import { PartialType } from '@nestjs/mapped-types';
import { CreateDestinatarioGrupoDto } from './create-destinatario-grupo.dto';

export class UpdateDestinatarioGrupoDto extends PartialType(CreateDestinatarioGrupoDto) {}
