import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { DestinatarioPersonaService } from './destinatario-persona.service';
import { CreateDestinatarioPersonaDto } from './dto/create-destinatario-persona.dto';
import { UpdateDestinatarioPersonaDto } from './dto/update-destinatario-persona.dto';

@Controller('destinatario-persona')
export class DestinatarioPersonaController {
  constructor(private readonly destinatarioPersonaService: DestinatarioPersonaService) {}

  @Post()
  create(@Body() createDestinatarioPersonaDto: CreateDestinatarioPersonaDto) {
    return this.destinatarioPersonaService.create(createDestinatarioPersonaDto);
  }

  @Get()
  findAll() {
    return this.destinatarioPersonaService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.destinatarioPersonaService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDestinatarioPersonaDto: UpdateDestinatarioPersonaDto) {
    return this.destinatarioPersonaService.update(+id, updateDestinatarioPersonaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.destinatarioPersonaService.remove(+id);
  }
}
