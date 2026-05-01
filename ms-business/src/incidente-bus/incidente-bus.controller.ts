import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { IncidenteBusService } from './incidente-bus.service';
import { CreateIncidenteBusDto } from './dto/create-incidente-bus.dto';
import { UpdateIncidenteBusDto } from './dto/update-incidente-bus.dto';

@Controller('incidente-bus')
export class IncidenteBusController {
  constructor(private readonly incidenteBusService: IncidenteBusService) {}

  @Post()
  create(@Body() createIncidenteBusDto: CreateIncidenteBusDto) {
    return this.incidenteBusService.create(createIncidenteBusDto);
  }

  @Get()
  findAll() {
    return this.incidenteBusService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.incidenteBusService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateIncidenteBusDto: UpdateIncidenteBusDto) {
    return this.incidenteBusService.update(+id, updateIncidenteBusDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.incidenteBusService.remove(+id);
  }
}
