import { PartialType } from '@nestjs/mapped-types';
import { CreateGrupoPersonaDto } from './create-grupo-persona.dto';

export class UpdateGrupoPersonaDto extends PartialType(CreateGrupoPersonaDto) {}
