import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, UseGuards, Request } from '@nestjs/common';
import { TurnoService } from './turno.service';
import { CreateTurnoDto } from './dto/create-turno.dto';
import { UpdateTurnoDto } from './dto/update-turno.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('turno')
export class TurnoController {
  constructor(private readonly turnoService: TurnoService) {}

  // ── Endpoint HU-006: obtiene el turno del conductor autenticado por JWT ──
  @UseGuards(JwtAuthGuard)
  @Get('conductor/activo')
  findTurnoActivo(@Request() req) {
    const authId = req.user.authId || req.user.sub;
    return this.turnoService.findTurnoActivoPorAuthId(authId);
  }
  
  // ── Endpoint HU-006: inicia el turno + emite SHIFT_STARTED por WebSocket ──
  @UseGuards(JwtAuthGuard)
  @Patch(':id/iniciar')
  iniciarTurno(
      @Param('id', ParseUUIDPipe) id: string,
      @Body('observaciones') observaciones?: string
  ) {
      return this.turnoService.iniciarTurno(id, observaciones);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/finalizar')
  finalizarTurno(
      @Param('id', ParseUUIDPipe) id: string,
      @Body('observaciones') observaciones?: string,
  ) {
      return this.turnoService.finalizarTurno(id, observaciones);
  }

  @Post()
  create(@Body() createTurnoDto: CreateTurnoDto) {
    return this.turnoService.create(createTurnoDto);
  }

  @Get()
  findAll() {
    return this.turnoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.turnoService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateTurnoDto: UpdateTurnoDto) {
    return this.turnoService.update(id, updateTurnoDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.turnoService.remove(id);
  }
}
