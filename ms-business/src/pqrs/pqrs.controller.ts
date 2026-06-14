import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { PqrsService } from './pqrs.service';
import { CreatePqrsDto, UpdatePqrsEstadoDto } from './dto/pqrs.dto';

@Controller('pqrs')
export class PqrsController {
  constructor(private readonly pqrsService: PqrsService) {}

  // n8n llama este endpoint para persistir la PQRS
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreatePqrsDto) {
    return this.pqrsService.create(dto);
  }

  @Get()
  findAll() {
    return this.pqrsService.findAll();
  }

  // Frontend consulta estado por radicado
  @Get('radicado/:radicado')
  findByRadicado(@Param('radicado') radicado: string) {
    return this.pqrsService.findByRadicado(radicado);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pqrsService.findOne(id);
  }

  // Agente cambia estado → ms-notifications llama n8n → notifica ciudadano
  @Patch('radicado/:radicado/estado')
  @HttpCode(HttpStatus.OK)
  updateEstado(
    @Param('radicado') radicado: string,
    @Body() dto: UpdatePqrsEstadoDto,
  ) {
    return this.pqrsService.updateEstado(radicado, dto);
  }
}