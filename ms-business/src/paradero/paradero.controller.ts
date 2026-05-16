// src/paradero/paradero.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ParaderoService } from './paradero.service';
import { CreateParaderoDto } from './dto/create-paradero.dto';
import { UpdateParaderoDto } from './dto/update-paradero.dto';

@Controller('paraderos')
export class ParaderoController {
  constructor(private readonly paraderoService: ParaderoService) {}

  @Post()
  create(@Body() createParaderoDto: CreateParaderoDto) {
    return this.paraderoService.create(createParaderoDto);
  }

  @Get('cercanos')
  findNearby(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radius') radius?: string,
  ) {
    const radiusMeters = radius ? parseFloat(radius) : 1000;
    return this.paraderoService.findNearby(parseFloat(lat), parseFloat(lng), radiusMeters);
  }

  @Get()
  findAll() {
    return this.paraderoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.paraderoService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateParaderoDto: UpdateParaderoDto,
  ) {
    return this.paraderoService.update(id, updateParaderoDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.paraderoService.remove(id);
  }
}