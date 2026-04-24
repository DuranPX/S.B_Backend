import { PartialType } from '@nestjs/mapped-types';
import { CreateNodoDto } from './create-nodo.dto';

export class UpdateNodoDto extends PartialType(CreateNodoDto) {}
