import { PartialType } from '@nestjs/mapped-types';
import { CreateIncidenteBusDto } from './create-incidente-bus.dto';

export class UpdateIncidenteBusDto extends PartialType(CreateIncidenteBusDto) {}
