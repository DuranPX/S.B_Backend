import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe } from '@nestjs/common';
import { TurnoService } from './turno.service';
import { CreateTurnoDto } from './dto/create-turno.dto';
import { UpdateTurnoDto } from './dto/update-turno.dto';

@Controller('turno')
export class TurnoController {
  constructor(private readonly turnoService: TurnoService) {}

  @Get('conductor/:conductorId/activo')
  findTurnoConductorActivo(@Param('conductorId', ParseUUIDPipe) conductorId: string) {
      return this.turnoService.findTurnoConductorActivo(conductorId);
  }

  @Patch(':id/iniciar')
  iniciarTurno(
      @Param('id', ParseUUIDPipe) id: string,
      @Body('observaciones') observaciones?: string
  ) {
      return this.turnoService.iniciarTurno(id, observaciones);
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
