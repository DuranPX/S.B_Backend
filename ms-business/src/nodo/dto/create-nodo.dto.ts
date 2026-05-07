// src/nodo/dto/create-nodo.dto.ts
import { IsNumber, IsNotEmpty } from 'class-validator';
import { IsValidLatitud, IsValidLongitud } from '../../common/validators/is-valid-coordinate.validator';

export class CreateNodoDto {
  @IsNotEmpty()
  @IsNumber()
  @IsValidLatitud()
  latitud: number;

  @IsNotEmpty()
  @IsNumber()
  @IsValidLongitud()
  longitud: number;
}