// src/ruta-paradero/ruta-paradero.controller.ts
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
import { RutaParaderoService } from './ruta_paradero.service';
import { CreateRutaParaderoDto } from './dto/create-ruta_paradero.dto';
import { UpdateRutaParaderoDto } from './dto/update-ruta_paradero.dto';

@Controller('ruta_paradero')
export class RutaParaderoController {
  constructor(private readonly rutaParaderoService: RutaParaderoService) {}

  @Post()
  create(@Body() createRutaParaderoDto: CreateRutaParaderoDto) {
    return this.rutaParaderoService.create(createRutaParaderoDto);
  }

  @Get()
  findAll() {
    return this.rutaParaderoService.findAll();
  }

  @Get('ruta/:ruta_id')
  findByRuta(@Param('ruta_id', ParseUUIDPipe) ruta_id: string) {
    return this.rutaParaderoService.findByRuta(ruta_id);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.rutaParaderoService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateRutaParaderoDto: UpdateRutaParaderoDto,
  ) {
    return this.rutaParaderoService.update(id, updateRutaParaderoDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.rutaParaderoService.remove(id);
  }
}