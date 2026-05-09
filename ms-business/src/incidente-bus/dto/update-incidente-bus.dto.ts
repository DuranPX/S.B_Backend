// src/incidente-bus/dto/update-incidente-bus.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateIncidenteBusDto } from './create-incidente-bus.dto';

export class UpdateIncidenteBusDto extends PartialType(CreateIncidenteBusDto) {}