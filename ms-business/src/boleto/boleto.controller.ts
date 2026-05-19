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
  Query,
} from '@nestjs/common';
import { BoletoService } from './boleto.service';
import { CreateBoletoDto } from './dto/create-boleto.dto';
import { UpdateBoletoDto } from './dto/update-boleto.dto';
import { CrearAbordajeDto } from './dto/crear-abordaje.dto';
import { RegistrarDescensoDto } from './dto/registrar-descenso.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('boletos')
export class BoletoController {
  constructor(private readonly boletoService: BoletoService) { }

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

  @UseGuards(JwtAuthGuard)
  @Get('mis-viajes')
  getMisViajes(@Request() req) {
    const authId = req.user.authId || req.user.sub;
    return this.boletoService.findByAuthId(authId);
  }

  @Get(':id/detalle')
  findOneDetallado(@Param('id', ParseUUIDPipe) id: string) {
    return this.boletoService.findOneDetallado(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  findMyTickets(@Request() req) {
    return this.boletoService.findByAuthId(req.user.authId);
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

  @Get('analytics/ingresos')
  getIngresosPorMetodoPago(@Query('meses') meses?: string) {
    return this.boletoService.getIngresosPorMetodoPago(Number(meses) || 6);
  }
}
