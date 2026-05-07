// src/ruta-paradero/dto/update-ruta-paradero.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateRutaParaderoDto } from './create-ruta_paradero.dto';

export class UpdateRutaParaderoDto extends PartialType(CreateRutaParaderoDto) {}