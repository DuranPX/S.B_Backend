import { PartialType } from '@nestjs/mapped-types';
import { CreateParaderoDto } from './create-paradero.dto';

export class UpdateParaderoDto extends PartialType(CreateParaderoDto) {}
