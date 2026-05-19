// Reemplaza el archivo completo:
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
  UseGuards,
  Request,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { IncidenteBusService } from './incidente-bus.service';
import { CreateIncidenteBusDto } from './dto/create-incidente-bus.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('incidente-bus')
export class IncidenteBusController {
  constructor(private readonly incidenteBusService: IncidenteBusService) {}

  @UseGuards(JwtAuthGuard)
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
    @Request() req,
    @Body() createIncidenteBusDto: CreateIncidenteBusDto,
    @UploadedFiles() fotos: Express.Multer.File[],
  ) {
    const authId = req.user.authId || req.user.sub;
    return this.incidenteBusService.reportarConFotos(createIncidenteBusDto, fotos, authId);
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

  @Get('bus/:bus_id')
  findByBus(@Param('bus_id', ParseUUIDPipe) bus_id: string) {
    return this.incidenteBusService.findByBus(bus_id);
  }
}