// src/incidente-bus/dto/create-incidente-bus.dto.ts
import {
  IsNotEmpty,
  IsUUID,
} from 'class-validator';

export class CreateIncidenteBusDto {
  @IsNotEmpty()
  @IsUUID()
  incidente_id: string;

  @IsNotEmpty()
  @IsUUID()
  bus_id: string;
}