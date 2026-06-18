import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, UseGuards, Request, Query } from '@nestjs/common';
import { MensajeService } from './mensaje.service';
import { CreateMensajeDto } from './dto/create-mensaje.dto';
import { UpdateMensajeDto } from './dto/update-mensaje.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('mensaje')
export class MensajeController {
  constructor(private readonly mensajeService: MensajeService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createMensajeDto: CreateMensajeDto) {
    return this.mensajeService.create(createMensajeDto);
  }

  // Bandeja de entrada — HU-007
  @UseGuards(JwtAuthGuard)
  @Get('bandeja')
  getBandeja(
    @Request() req,
    @Query('soloNoLeidos') soloNoLeidos?: string,
  ) {
    const authId = req.user.authId || req.user.sub;
    return this.mensajeService.getBandejaEntrada(authId, {
      soloNoLeidos: soloNoLeidos === 'true',
    });
  }

  // Contar no leídos — badge
  @UseGuards(JwtAuthGuard)
  @Get('no-leidos/count')
  countNoLeidos(@Request() req) {
    const authId = req.user.authId || req.user.sub;
    return this.mensajeService.countNoLeidos(authId);
  }

  // Marcar como leído
  @UseGuards(JwtAuthGuard)
  @Patch('leido/:destPersonaId')
  marcarLeido(@Param('destPersonaId', ParseUUIDPipe) destPersonaId: string) {
    return this.mensajeService.marcarLeido(destPersonaId);
  }

  @Get()
  findAll() {
    return this.mensajeService.findAll();
  }

  @Get('enviados/:personaId')
  findSentMessages(
    @Param('personaId', ParseUUIDPipe)
    personaId: string,
  ) {
    return this.mensajeService.findSentMessages(personaId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.mensajeService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateMensajeDto: UpdateMensajeDto) {
    return this.mensajeService.update(id, updateMensajeDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.mensajeService.remove(id);
  }
}