import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CiudadanoService } from './ciudadano.service';
import { CreateCiudadanoDto } from './dto/create-ciudadano.dto';
import { UpdateCiudadanoDto } from './dto/update-ciudadano.dto';

@Controller('ciudadano')
export class CiudadanoController {
  constructor(private readonly ciudadanoService: CiudadanoService) {}

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
}
