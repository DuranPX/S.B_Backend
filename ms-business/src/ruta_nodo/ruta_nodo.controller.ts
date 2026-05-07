// src/ruta-nodo/ruta-nodo.controller.ts
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
import { RutaNodoService } from './ruta_nodo.service';
import { CreateRutaNodoDto } from './dto/create-ruta_nodo.dto';
import { UpdateRutaNodoDto } from './dto/update-ruta_nodo.dto';

@Controller('ruta_nodo')
export class RutaNodoController {
  constructor(private readonly rutaNodoService: RutaNodoService) {}

  @Post()
  create(@Body() createRutaNodoDto: CreateRutaNodoDto) {
    return this.rutaNodoService.create(createRutaNodoDto);
  }

  @Get()
  findAll() {
    return this.rutaNodoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.rutaNodoService.findOne(id);
  }

  // Endpoint para consultar todos los nodos de una ruta específica
  @Get('ruta/:ruta_id')
  findByRuta(@Param('ruta_id', ParseUUIDPipe) ruta_id: string) {
    return this.rutaNodoService.findByRuta(ruta_id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateRutaNodoDto: UpdateRutaNodoDto,
  ) {
    return this.rutaNodoService.update(id, updateRutaNodoDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.rutaNodoService.remove(id);
  }
}