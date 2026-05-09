// src/incidente-bus/incidente-bus.controller.ts
import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { IncidenteBusService } from './incidente-bus.service';
import { CreateIncidenteBusDto } from './dto/create-incidente-bus.dto';

@Controller('incidente-bus')
export class IncidenteBusController {
  constructor(private readonly incidenteBusService: IncidenteBusService) {}

  // Endpoint estrella — reporte de incidente con carga de fotos
  @Post('reportar')
  @UseInterceptors(
    FilesInterceptor('fotos', 10, {
      storage: diskStorage({
        destination: './uploads/incidentes',
        filename: (req, file, cb) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|webp/;
        const isValid = allowedTypes.test(extname(file.originalname).toLowerCase());
        if (isValid) {
          cb(null, true);
        } else {
          cb(new Error('Solo se permiten imágenes jpeg, jpg, png o webp'), false);
        }
      },
    }),
  )
  reportar(
    @Body() createIncidenteBusDto: CreateIncidenteBusDto,
    @UploadedFiles() fotos: Express.Multer.File[],
  ) {
    return this.incidenteBusService.reportarConFotos(createIncidenteBusDto, fotos);
  }

  @Get()
  findAll() {
    return this.incidenteBusService.findAll();
  }

  @Get('incidente/:incidente_id')
  findByIncidente(@Param('incidente_id', ParseUUIDPipe) incidente_id: string) {
    return this.incidenteBusService.findByIncidente(incidente_id);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.incidenteBusService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.incidenteBusService.remove(id);
  }
}