import { Controller, Get, Post, Body, Patch, Param, Delete, Query, HttpCode, HttpStatus, ParseUUIDPipe } from '@nestjs/common';
import { CiudadanoService } from './ciudadano.service';
import { CreateCiudadanoDto } from './dto/create-ciudadano.dto';
import { UpdateCiudadanoDto } from './dto/update-ciudadano.dto';

@Controller('ciudadano')
export class CiudadanoController {
  constructor(private readonly ciudadanoService: CiudadanoService) { }

  @Get('/analiticas/rango-etario')
  getDistribucionEtaria(
    @Query('rutaId') rutaId?: string,
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
  ) {
    return this.ciudadanoService.getDistribucionEtaria({ rutaId, fechaInicio, fechaFin });
  }

  @Post()
  create(@Body() createCiudadanoDto: CreateCiudadanoDto) {
    return this.ciudadanoService.create(createCiudadanoDto);
  }

  @Get()
  findAll() {
    return this.ciudadanoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ciudadanoService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCiudadanoDto: UpdateCiudadanoDto) {
    return this.ciudadanoService.update(id, updateCiudadanoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ciudadanoService.remove(id);
  }

  // ── Agregar estos endpoints al CiudadanoController existente ──

  // n8n cron llama: GET /ciudadano/alertas-clima-activas
  @Get('alertas-clima-activas')
  findConAlertasActivas() {
    return this.ciudadanoService.findConAlertasActivas();
  }

  // Frontend llama: PATCH /ciudadano/:id/alerta-clima
  @Patch(':id/alerta-clima')
  @HttpCode(HttpStatus.OK)
  updateAlertaClima(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { activa: boolean; horarioViaje?: string },
  ) {
    return this.ciudadanoService.updateAlertaClima(
      id,
      body.activa,
      body.horarioViaje,
    );
  }
}
