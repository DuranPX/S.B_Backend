// src/ruta/ruta.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { RutaService } from './ruta.service';
import { CreateRutaDto } from './dto/create-ruta.dto';
import { UpdateRutaDto } from './dto/update-ruta.dto';
import { CrearRutaFullDto } from './dto/create-ruta-full.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('rutas')
export class RutaController {
  constructor(private readonly rutaService: RutaService) {}

  @Post()
  create(@Body() createRutaDto: CreateRutaDto) {
    return this.rutaService.create(createRutaDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('full')
  createFull(@Body() dto: CrearRutaFullDto) {
    return this.rutaService.createFull(dto);
  }

  @Get()
  findAll(@Query('nombre') nombre?: string) {
    return this.rutaService.findAll(nombre);
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