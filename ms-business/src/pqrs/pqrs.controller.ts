import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Res,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';

import { FilesInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { PqrsService } from './pqrs.service';
import { CreatePqrsDto, UpdatePqrsEstadoDto } from './dto/pqrs.dto';

@Controller('pqrs')
export class PqrsController {
  constructor(private readonly pqrsService: PqrsService) {}

  // n8n llama este endpoint para persistir la PQRS
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FilesInterceptor('fotos', 3, {
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  create(
    @Body() dto: CreatePqrsDto,
    @UploadedFiles() fotos: Express.Multer.File[],
  ) {
    return this.pqrsService.create(dto, fotos);
  }

  @Get()
  findAll() {
    return this.pqrsService.findAll();
  }

  // Frontend consulta estado por radicado
  @Get('radicado/:radicado')
  findByRadicado(@Param('radicado') radicado: string) {
    return this.pqrsService.findByRadicado(radicado);
  }
  // Agente cambia estado → ms-notifications llama n8n → notifica ciudadano
  @Patch('radicado/:radicado/estado')
  @HttpCode(HttpStatus.OK)
  updateEstado(
    @Param('radicado') radicado: string,
    @Body() dto: UpdatePqrsEstadoDto,
  ) {
    return this.pqrsService.updateEstado(radicado, dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pqrsService.findOne(id);
  }

  @Get(':pqrsId/fotos/:fotoId')
  async getFoto(
    @Param('pqrsId') pqrsId: string,
    @Param('fotoId') fotoId: string,
    @Res() res: Response,
  ) {
    const foto = await this.pqrsService.getFoto(
      pqrsId,
      fotoId,
    );

    res.setHeader(
      'Content-Type',
      foto.mimeType,
    );

    return res.send(foto.datos);
  }

}