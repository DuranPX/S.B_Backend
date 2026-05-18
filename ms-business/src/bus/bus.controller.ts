import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { BusService } from './bus.service';
import { CreateBusDto } from './dto/create-bus.dto';
import { UpdateBusDto } from './dto/update-bus.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('bus')
export class BusController {
    constructor(private readonly busService: BusService) {}

    @UseGuards(JwtAuthGuard)
    @Post()
    create(@Request() req, @Body() createBusDto: CreateBusDto) {
        const authId = req.user.authId || req.user.sub;
        return this.busService.create(createBusDto, authId);
    }

    @Get()
    findAll() {
        return this.busService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.busService.findOne(id);
    }

    @Get(':id/ubicacion')
    getUltimaUbicacion(@Param('id') id: string) {
        return this.busService.getUltimaUbicacion(id);
    }

    @Get('placa/:placa')
    findByPlaca(@Param('placa') placa: string) {
        return this.busService.findByPlaca(placa);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateBusDto: UpdateBusDto) {
        return this.busService.update(id, updateBusDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.busService.remove(id);
    }
}