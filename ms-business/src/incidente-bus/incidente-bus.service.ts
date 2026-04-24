import { Injectable } from '@nestjs/common';
import { CreateIncidenteBusDto } from './dto/create-incidente-bus.dto';
import { UpdateIncidenteBusDto } from './dto/update-incidente-bus.dto';

@Injectable()
export class IncidenteBusService {
  create(createIncidenteBusDto: CreateIncidenteBusDto) {
    return 'This action adds a new incidenteBus';
  }

  findAll() {
    return `This action returns all incidenteBus`;
  }

  findOne(id: number) {
    return `This action returns a #${id} incidenteBus`;
  }

  update(id: number, updateIncidenteBusDto: UpdateIncidenteBusDto) {
    return `This action updates a #${id} incidenteBus`;
  }

  remove(id: number) {
    return `This action removes a #${id} incidenteBus`;
  }
}
