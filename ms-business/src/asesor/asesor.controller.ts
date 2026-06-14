import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { AsesorService } from './asesor.service';
import { CreateAsesorDto } from './dto/create-asesor.dto';
import { UpdateAsesorDto } from './dto/update-asesor.dto';

@Controller('asesor')
export class AsesorController {
  constructor(private readonly asesorService: AsesorService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createAsesorDto: CreateAsesorDto) {
    return this.asesorService.create(createAsesorDto);
  }

  @Get()
  findAll() {
    return this.asesorService.findAll();
  }

  /**
   * Endpoint específico para n8n:
   * GET /asesor/disponibles
   * Devuelve solo los asesores con disponible = true,
   * incluyendo su calendarId para que n8n consulte Google Calendar.
   *
   * n8n llama: GET http://ms-business:3000/asesor/disponibles
   */
  @Get('disponibles')
  findDisponibles() {
    return this.asesorService.findDisponibles();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.asesorService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAsesorDto: UpdateAsesorDto,
  ) {
    return this.asesorService.update(id, updateAsesorDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.asesorService.remove(id);
  }
}