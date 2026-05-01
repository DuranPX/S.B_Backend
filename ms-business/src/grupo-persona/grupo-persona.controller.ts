import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { GrupoPersonaService } from './grupo-persona.service';
import { CreateGrupoPersonaDto } from './dto/create-grupo-persona.dto';
import { UpdateGrupoPersonaDto } from './dto/update-grupo-persona.dto';

@Controller('grupo-persona')
export class GrupoPersonaController {
  constructor(private readonly grupoPersonaService: GrupoPersonaService) {}

  @Post()
  create(@Body() createGrupoPersonaDto: CreateGrupoPersonaDto) {
    return this.grupoPersonaService.create(createGrupoPersonaDto);
  }

  @Get()
  findAll() {
    return this.grupoPersonaService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.grupoPersonaService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateGrupoPersonaDto: UpdateGrupoPersonaDto) {
    return this.grupoPersonaService.update(+id, updateGrupoPersonaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.grupoPersonaService.remove(+id);
  }
}
