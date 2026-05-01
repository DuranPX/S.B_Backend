import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { FotoService } from './foto.service';
import { CreateFotoDto } from './dto/create-foto.dto';
import { UpdateFotoDto } from './dto/update-foto.dto';

@Controller('foto')
export class FotoController {
  constructor(private readonly fotoService: FotoService) {}

  @Post()
  create(@Body() createFotoDto: CreateFotoDto) {
    return this.fotoService.create(createFotoDto);
  }

  @Get()
  findAll() {
    return this.fotoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.fotoService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFotoDto: UpdateFotoDto) {
    return this.fotoService.update(+id, updateFotoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.fotoService.remove(+id);
  }
}
