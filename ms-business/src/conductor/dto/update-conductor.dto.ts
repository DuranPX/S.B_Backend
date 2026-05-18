import { PartialType } from '@nestjs/mapped-types';
import { CreateConductorDto } from './create-conductor.dto';
import { IsOptional, IsArray, IsUUID } from 'class-validator';

export class UpdateConductorDto extends PartialType(CreateConductorDto) {
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  empresasIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  turnosIds?: string[];
}
