import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ConductorService } from './conductor.service';
import { CreateConductorDto } from './dto/create-conductor.dto';
import { UpdateConductorDto } from './dto/update-conductor.dto';

@Controller('conductor')
export class ConductorController {
  constructor(private readonly conductorService: ConductorService) {}

  @Post()
  create(@Body() createConductorDto: CreateConductorDto) {
    return this.conductorService.create(createConductorDto);
  }

  @Get()
  findAll() {
    return this.conductorService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.conductorService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateConductorDto: UpdateConductorDto) {
    return this.conductorService.update(+id, updateConductorDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.conductorService.remove(+id);
  }
}
