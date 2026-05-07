
import { PartialType } from '@nestjs/mapped-types';
import { CreateRutaNodoDto } from './create-ruta_nodo.dto';

export class UpdateRutaNodoDto extends PartialType(CreateRutaNodoDto) {}