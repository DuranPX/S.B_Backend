// src/foto/dto/create-foto.dto.ts
import {
  IsNotEmpty,
  IsUUID,
  IsString,
} from 'class-validator';

export class CreateFotoDto {
  @IsNotEmpty()
  @IsString()
  url: string;

  @IsNotEmpty()
  @IsUUID()
  incidente_bus_id: string;
}