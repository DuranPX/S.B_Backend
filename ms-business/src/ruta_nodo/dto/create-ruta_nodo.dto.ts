// src/ruta-nodo/dto/create-ruta-nodo.dto.ts
import {
  IsNotEmpty,
  IsNumber,
  IsUUID,
  IsInt,
  Min,
} from 'class-validator';
import { IsUniqueOrden } from '../../common/validators/is-unique-orden.validator';

export class CreateRutaNodoDto {
  @IsNotEmpty()
  @IsUUID()
  ruta_id: string;

  @IsNotEmpty()
  @IsUUID()
  nodo_id: string;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @IsUniqueOrden()
  orden: number;
}