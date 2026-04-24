import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { DestinatarioGrupoService } from './destinatario-grupo.service';
import { CreateDestinatarioGrupoDto } from './dto/create-destinatario-grupo.dto';
import { UpdateDestinatarioGrupoDto } from './dto/update-destinatario-grupo.dto';

@Controller('destinatario-grupo')
export class DestinatarioGrupoController {
  constructor(private readonly destinatarioGrupoService: DestinatarioGrupoService) {}

  @Post()
  create(@Body() createDestinatarioGrupoDto: CreateDestinatarioGrupoDto) {
    return this.destinatarioGrupoService.create(createDestinatarioGrupoDto);
  }

  @Get()
  findAll() {
    return this.destinatarioGrupoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.destinatarioGrupoService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDestinatarioGrupoDto: UpdateDestinatarioGrupoDto) {
    return this.destinatarioGrupoService.update(+id, updateDestinatarioGrupoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.destinatarioGrupoService.remove(+id);
  }
}
