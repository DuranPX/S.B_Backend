import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { GrupoService } from './grupo.service';
import { CreateGrupoDto } from './dto/create-grupo.dto';
import { UpdateGrupoDto } from './dto/update-grupo.dto';

@Controller('grupo')
export class GrupoController {
  constructor(private readonly grupoService: GrupoService) {}

  // ─────────────────────────────────────────────
  // CRUD BÁSICO DE GRUPOS
  // ─────────────────────────────────────────────

  @Post()
  create(@Body() createGrupoDto: CreateGrupoDto) {
    return this.grupoService.create(createGrupoDto);
  }

  @Get()
  findAll() {
    return this.grupoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.grupoService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateGrupoDto: UpdateGrupoDto) {
    return this.grupoService.update(id, updateGrupoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.grupoService.remove(id);
  }

  // ─────────────────────────────────────────────
  // GESTIÓN DE MIEMBROS
  // ─────────────────────────────────────────────

  // Agregar miembro al grupo
  @Post(':id/miembros')
  addMember(
    @Param('id') grupoId: string,
    @Body('personaId') personaId: string
  ) {
    return this.grupoService.addMember(grupoId, personaId);
  }

  // Remover miembro del grupo
  @Delete(':id/miembros/:personaId')
  removeMember(
    @Param('id') grupoId: string,
    @Param('personaId') personaId: string
  ) {
    return this.grupoService.removeMember(grupoId, personaId);
  }

  // Ver miembros de un grupo
  @Get(':id/miembros')
  getMembers(@Param('id') grupoId: string) {
    return this.grupoService.getMembers(grupoId);
  }

  // Ver grupos de una persona
  @Get('persona/:personaId/grupos')
  getGruposByPersona(@Param('personaId') personaId: string) {
    return this.grupoService.getGruposByPersona(personaId);
  }
}