// src/historial/historial.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { HistorialService } from './historial.service';
import { CreateHistorialDto } from './dto/create-historial.dto';
import { UpdateHistorialDto } from './dto/update-historial.dto';

@Controller('historial')
export class HistorialController {
  constructor(private readonly historialService: HistorialService) {}

  @Post()
  create(@Body() createHistorialDto: CreateHistorialDto) {
    return this.historialService.create(createHistorialDto);
  }

  @Get()
  findAll() {
    return this.historialService.findAll();
  }

  // Endpoint de historial completo de un ciudadano
  @Get('ciudadano/:ciudadano_id')
  findByCiudadano(@Param('ciudadano_id', ParseUUIDPipe) ciudadano_id: string) {
    return this.historialService.findByciudadano(ciudadano_id);
  }

  // Endpoint estrella — historial de viajes de un ciudadano
  @Get('ciudadano/:ciudadano_id/viajes')
  findViajesByCiudadano(@Param('ciudadano_id', ParseUUIDPipe) ciudadano_id: string) {
    return this.historialService.findViajesByCiudadano(ciudadano_id);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.historialService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateHistorialDto: UpdateHistorialDto,
  ) {
    return this.historialService.update(id, updateHistorialDto);
  }
}