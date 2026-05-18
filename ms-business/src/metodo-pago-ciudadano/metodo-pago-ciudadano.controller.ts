import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { MetodoPagoCiudadanoService } from './metodo-pago-ciudadano.service';
import { CreateMetodoPagoCiudadanoDto } from './dto/create-metodo-pago-ciudadano.dto';
import { UpdateMetodoPagoCiudadanoDto } from './dto/update-metodo-pago-ciudadano.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('metodo-pago-ciudadano')
export class MetodoPagoCiudadanoController {
  constructor(private readonly metodoPagoCiudadanoService: MetodoPagoCiudadanoService) {}

  @Post()
  create(@Body() createMetodoPagoCiudadanoDto: CreateMetodoPagoCiudadanoDto) {
    return this.metodoPagoCiudadanoService.create(createMetodoPagoCiudadanoDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('verificar-epayco')
  verificarEpayco(@Request() req, @Body('ref_payco') refPayco: string) {
    const authId = req.user?.authId || req.user?.sub || req.user?.id;
    return this.metodoPagoCiudadanoService.verificarEpayco(refPayco, authId);
  }

  @Get()
  findAll() {
    return this.metodoPagoCiudadanoService.findAll();
  }

  @Get('ciudadano/:ciudadanoId')
  findByCiudadano(@Param('ciudadanoId') ciudadanoId: string) {
    return this.metodoPagoCiudadanoService.findByCiudadano(ciudadanoId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.metodoPagoCiudadanoService.findOne(id);
  }

  @Patch(':id/recarga')
  recargar(@Param('id') id: string, @Body('monto') monto: number) {
    return this.metodoPagoCiudadanoService.recargar(id, Number(monto));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMetodoPagoCiudadanoDto: UpdateMetodoPagoCiudadanoDto) {
    return this.metodoPagoCiudadanoService.update(id, updateMetodoPagoCiudadanoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.metodoPagoCiudadanoService.remove(id);
  }
}
