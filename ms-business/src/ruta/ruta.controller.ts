// src/ruta/ruta.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { RutaService } from './ruta.service';
import { CreateRutaDto } from './dto/create-ruta.dto';
import { UpdateRutaDto } from './dto/update-ruta.dto';

@Controller('rutas')
export class RutaController {
  constructor(private readonly rutaService: RutaService) {}

  @Post()
  create(@Body() createRutaDto: CreateRutaDto) {
    return this.rutaService.create(createRutaDto);
  }

  @Get()
  findAll() {
    return this.rutaService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.rutaService.findOne(id);
  }

  // Endpoint estrella — ruta completa con nodos y paraderos ordenados
  @Get(':id/completa')
  findRutaCompleta(@Param('id', ParseUUIDPipe) id: string) {
    return this.rutaService.findRutaCompleta(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateRutaDto: UpdateRutaDto,
  ) {
    return this.rutaService.update(id, updateRutaDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.rutaService.remove(id);
  }
}