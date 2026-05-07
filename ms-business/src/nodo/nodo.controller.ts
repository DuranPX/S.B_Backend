// src/nodo/nodo.controller.ts
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
import { NodoService } from './nodo.service';
import { CreateNodoDto } from './dto/create-nodo.dto';
import { UpdateNodoDto } from './dto/update-nodo.dto';

@Controller('nodos')
export class NodoController {
  constructor(private readonly nodoService: NodoService) {}

  @Post()
  create(@Body() createNodoDto: CreateNodoDto) {
    return this.nodoService.create(createNodoDto);
  }

  @Get()
  findAll() {
    return this.nodoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.nodoService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateNodoDto: UpdateNodoDto,
  ) {
    return this.nodoService.update(id, updateNodoDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.nodoService.remove(id);
  }
}