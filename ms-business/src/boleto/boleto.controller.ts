// src/boleto/boleto.controller.ts
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
import { BoletoService } from './boleto.service';
import { CreateBoletoDto } from './dto/create-boleto.dto';
import { UpdateBoletoDto } from './dto/update-boleto.dto';

@Controller('boletos')
export class BoletoController {
  constructor(private readonly boletoService: BoletoService) {}

  // Endpoint estrella — compra de boleto
  @Post('comprar')
  comprar(@Body() createBoletoDto: CreateBoletoDto) {
    return this.boletoService.comprar(createBoletoDto);
  }

  @Get()
  findAll() {
    return this.boletoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.boletoService.findOne(id);
  }

  // Endpoint para cancelar un boleto
  @Patch(':id/cancelar')
  cancelar(@Param('id', ParseUUIDPipe) id: string) {
    return this.boletoService.cancelar(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateBoletoDto: UpdateBoletoDto,
  ) {
    return this.boletoService.update(id, updateBoletoDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.boletoService.remove(id);
  }
}