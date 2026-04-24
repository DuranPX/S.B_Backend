import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ParaderoService } from './paradero.service';
import { CreateParaderoDto } from './dto/create-paradero.dto';
import { UpdateParaderoDto } from './dto/update-paradero.dto';

@Controller('paradero')
export class ParaderoController {
  constructor(private readonly paraderoService: ParaderoService) {}

  @Post()
  create(@Body() createParaderoDto: CreateParaderoDto) {
    return this.paraderoService.create(createParaderoDto);
  }

  @Get()
  findAll() {
    return this.paraderoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.paraderoService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateParaderoDto: UpdateParaderoDto) {
    return this.paraderoService.update(+id, updateParaderoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.paraderoService.remove(+id);
  }
}
