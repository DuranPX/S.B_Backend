import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { NodoService } from './nodo.service';
import { CreateNodoDto } from './dto/create-nodo.dto';
import { UpdateNodoDto } from './dto/update-nodo.dto';

@Controller('nodo')
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
  findOne(@Param('id') id: string) {
    return this.nodoService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateNodoDto: UpdateNodoDto) {
    return this.nodoService.update(+id, updateNodoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.nodoService.remove(+id);
  }
}
