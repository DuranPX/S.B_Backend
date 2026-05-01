import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { IncidenteService } from './incidente.service';
import { CreateIncidenteDto } from './dto/create-incidente.dto';
import { UpdateIncidenteDto } from './dto/update-incidente.dto';

@Controller('incidente')
export class IncidenteController {
  constructor(private readonly incidenteService: IncidenteService) {}

  @Post()
  create(@Body() createIncidenteDto: CreateIncidenteDto) {
    return this.incidenteService.create(createIncidenteDto);
  }

  @Get()
  findAll() {
    return this.incidenteService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.incidenteService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateIncidenteDto: UpdateIncidenteDto) {
    return this.incidenteService.update(+id, updateIncidenteDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.incidenteService.remove(+id);
  }
}
