// src/foto/foto.controller.ts
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
import { FotoService } from './foto.service';
import { CreateFotoDto } from './dto/create-foto.dto';
import { UpdateFotoDto } from './dto/update-foto.dto';

@Controller('fotos')
export class FotoController {
  constructor(private readonly fotoService: FotoService) {}

  @Post()
  create(@Body() createFotoDto: CreateFotoDto) {
    return this.fotoService.create(createFotoDto);
  }

  @Get()
  findAll() {
    return this.fotoService.findAll();
  }

  // Fotos de un incidente-bus específico
  @Get('incidente-bus/:incidente_bus_id')
  findByIncidenteBus(
    @Param('incidente_bus_id', ParseUUIDPipe) incidente_bus_id: string,
  ) {
    return this.fotoService.findByIncidenteBus(incidente_bus_id);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.fotoService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateFotoDto: UpdateFotoDto,
  ) {
    return this.fotoService.update(id, updateFotoDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.fotoService.remove(id);
  }
}