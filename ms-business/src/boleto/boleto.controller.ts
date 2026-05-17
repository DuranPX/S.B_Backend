// src/boleto/boleto.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { BoletoService } from './boleto.service';
import { CreateBoletoDto } from './dto/create-boleto.dto';
import { UpdateBoletoDto } from './dto/update-boleto.dto';
import { CrearAbordajeDto } from './dto/crear-abordaje.dto';
import { RegistrarDescensoDto } from './dto/registrar-descenso.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('boletos')
export class BoletoController {
  constructor(private readonly boletoService: BoletoService) {}

  @UseGuards(JwtAuthGuard)
  @Post('abordaje')
  comprar(@Request() req, @Body() dto: CrearAbordajeDto) {
    // req.user viene del JWT. Validamos si tiene un authId válido.
    const authId = req.user.authId || req.user.sub || req.user.id;
    return this.boletoService.procesarAbordaje(authId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/descenso')
  registrarDescenso(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RegistrarDescensoDto,
  ) {
    const authId = req.user.authId || req.user.sub || req.user.id;
    return this.boletoService.registrarDescenso(id, authId, dto);
  }

  @Get()
  findAll() {
    return this.boletoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.boletoService.findOne(id);
  }

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
