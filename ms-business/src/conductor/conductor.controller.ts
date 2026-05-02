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
import { ConductorService } from './conductor.service';
import { CreateConductorDto } from './dto/create-conductor.dto';
import { UpdateConductorDto } from './dto/update-conductor.dto';

// Nota: Igual que en Persona, en Fase 2 se protegerá con JwtAuthGuard
// y roles específicos (ej. solo ADMIN puede crear conductores)
@Controller('conductor')
export class ConductorController {
  constructor(private readonly conductorService: ConductorService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createConductorDto: CreateConductorDto) {
    return this.conductorService.create(createConductorDto);
  }

  @Get()
  findAll() {
    return this.conductorService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.conductorService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateConductorDto: UpdateConductorDto,
  ) {
    return this.conductorService.update(id, updateConductorDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.conductorService.remove(id);
  }
}
