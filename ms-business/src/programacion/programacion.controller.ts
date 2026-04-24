import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ProgramacionService } from './programacion.service';
import { CreateProgramacionDto } from './dto/create-programacion.dto';
import { UpdateProgramacionDto } from './dto/update-programacion.dto';

@Controller('programacion')
export class ProgramacionController {
  constructor(private readonly programacionService: ProgramacionService) {}

  @Post()
  create(@Body() createProgramacionDto: CreateProgramacionDto) {
    return this.programacionService.create(createProgramacionDto);
  }

  @Get()
  findAll() {
    return this.programacionService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.programacionService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProgramacionDto: UpdateProgramacionDto) {
    return this.programacionService.update(+id, updateProgramacionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.programacionService.remove(+id);
  }
}
