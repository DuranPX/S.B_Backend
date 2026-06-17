// src/programacion/programacion.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ProgramacionService } from './programacion.service';
import { CreateProgramacionDto } from './dto/create-programacion.dto';
import { UpdateProgramacionDto } from './dto/update-programacion.dto';

@Controller('programaciones')
export class ProgramacionController {
  constructor(private readonly programacionService: ProgramacionService) { }

  @Post()
  create(@Body() createProgramacionDto: CreateProgramacionDto) {
    return this.programacionService.create(createProgramacionDto);
  }

  @Get()
  findAll() {
    return this.programacionService.findAll();
  }

  @Get('bus/:busId/activa')
  findActiveByBus(
    @Param(
      'busId',
      ParseUUIDPipe
    )
    busId: string
  ) {
    return this
      .programacionService
      .findActiveByBus(
        busId
      );
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.programacionService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProgramacionDto: UpdateProgramacionDto,
  ) {
    return this.programacionService.update(id, updateProgramacionDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.programacionService.remove(id);
  }
}