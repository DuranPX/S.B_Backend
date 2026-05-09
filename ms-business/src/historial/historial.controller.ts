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

  // Historial de un boleto específico
  @Get('boleto/:boleto_id')
  findByBoleto(@Param('boleto_id', ParseUUIDPipe) boleto_id: string) {
    return this.historialService.findByBoleto(boleto_id);
  }

  // Endpoint estrella — todos los viajes registrados
  @Get('viajes')
  findViajes() {
    return this.historialService.findViajes();
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