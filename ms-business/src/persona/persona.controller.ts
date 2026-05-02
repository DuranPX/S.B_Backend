import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { CreatePersonaDto } from './dto/create-persona.dto';
import { UpdatePersonaDto } from './dto/update-persona.dto';
import { PersonaService } from './persona.service';

// ──────────────────────────────────────────────────────────────────────────────
// NOTA DE SEGURIDAD – Fase 1
// El guard de autenticación (JwtAuthGuard) se añadirá en la Fase 2 cuando se
// integre ms-security.  Por ahora las rutas son accesibles para pruebas internas
// en Postman con un JWT válido decodificado manualmente.
//
// El authId NUNCA viene del body; se extrae de req.user.id (payload del JWT).
// En Fase 2 el guard verificará la firma del token con ms-security.
// ──────────────────────────────────────────────────────────────────────────────
@Controller('persona')
export class PersonaController {
  constructor(private readonly personaService: PersonaService) {}

  // POST /persona
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Req() req: Request, @Body() dto: CreatePersonaDto) {
    // Fase 1: se asume req.user poblado por un guard futuro.
    // Fase 2: JwtAuthGuard garantiza que req.user.id es válido.
    const authId = (req as any).user?.id as string;
    return this.personaService.create(dto, authId);
  }

  // GET /persona
  @Get()
  findAll() {
    return this.personaService.findAll();
  }

  // GET /persona/:id
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.personaService.findOne(id);
  }

  // PATCH /persona/:id
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePersonaDto,
  ) {
    return this.personaService.update(id, dto);
  }

  // DELETE /persona/:id
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.personaService.remove(id);
  }
}
