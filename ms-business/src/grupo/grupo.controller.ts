import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { GrupoService } from './grupo.service';
import { CreateGrupoDto } from './dto/create-grupo.dto';
import { UpdateGrupoDto } from './dto/update-grupo.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('grupo')
export class GrupoController {
    constructor(private readonly grupoService: GrupoService) { }

    @UseGuards(JwtAuthGuard)
    @Get('mis-invitaciones')
    getMisInvitaciones(@Request() req) {
        const authId = req.user.authId || req.user.sub;
        const email = req.user.email;
        return this.grupoService.getMisInvitaciones(authId, email);
    }

    @Get(':id/log')
    getLog(@Param('id') grupoId: string) {
        return this.grupoService.getLog(grupoId);
    }

    // ─────────────────────────────────────────────
    // CRUD BÁSICO
    // ─────────────────────────────────────────────

    @UseGuards(JwtAuthGuard)
    @Post()
    create(@Request() req, @Body() createGrupoDto: CreateGrupoDto) {
        const authId = req.user.authId || req.user.sub;
        const email = req.user.email;
        return this.grupoService.create(createGrupoDto, authId, email);
    }

    @Get()
    findAll(@Query('nombre') nombre?: string) {
        return this.grupoService.findAll(nombre);
    }

    // Directorio de grupos públicos — HU-009
    @Get('publicos')
    findPublicos(@Query('nombre') nombre?: string) {
        return this.grupoService.findPublicos(nombre);
    }

    // Grupos del usuario autenticado
    @UseGuards(JwtAuthGuard)
    @Get('mis-grupos')
    getMisGrupos(@Request() req) {
        const authId = req.user.authId || req.user.sub;
        const email = req.user.email;
        return this.grupoService.getGruposByPersona(authId, email);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.grupoService.findOne(id);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    update(@Param('id') id: string, @Body() updateGrupoDto: UpdateGrupoDto, @Request() req) {
        const authId = req.user.authId || req.user.sub;
        return this.grupoService.update(id, updateGrupoDto, authId);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    remove(@Param('id') id: string, @Request() req) {
        const authId = req.user.authId || req.user.sub;
        return this.grupoService.remove(id, authId);
    }

    // ─────────────────────────────────────────────
    // GESTIÓN DE MIEMBROS
    // ─────────────────────────────────────────────

    // Agregar miembro (admin agrega a alguien) — HU-006/010
    @UseGuards(JwtAuthGuard)
    @Post(':id/miembros')
    addMember(@Param('id') grupoId: string, @Body('personaId') personaId: string) {
        return this.grupoService.addMember(grupoId, personaId);
    }

    // Unirse a grupo público — HU-009
    @UseGuards(JwtAuthGuard)
    @Post(':id/unirse')
    joinGroup(@Param('id') grupoId: string, @Request() req) {
        console.log('joinGroup llamado, grupoId:', grupoId); // ← agregar
        const authId = req.user.authId || req.user.sub;
        return this.grupoService.joinPublicGroup(grupoId, authId);
    }

    // Salir del grupo — HU-011
    @UseGuards(JwtAuthGuard)
    @Delete(':id/salir')
    leaveGroup(@Param('id') grupoId: string, @Request() req) {
        const authId = req.user.authId || req.user.sub;
        return this.grupoService.leaveGroup(grupoId, authId);
    }

    // Remover miembro (admin) — HU-010
    @UseGuards(JwtAuthGuard)
    @Delete(':id/miembros/:personaId')
    removeMember(@Param('id') grupoId: string, @Param('personaId') personaId: string) {
        return this.grupoService.removeMember(grupoId, personaId);
    }

    // Promover a admin — HU-010
    @UseGuards(JwtAuthGuard)
    @Patch(':id/miembros/:personaId/promover')
    promoteMember(@Param('id') grupoId: string, @Param('personaId') personaId: string) {
        return this.grupoService.promoteMember(grupoId, personaId);
    }

    // Bloquear usuario — HU-010
    @UseGuards(JwtAuthGuard)
    @Post(':id/miembros/:personaId/bloquear')
    blockMember(@Param('id') grupoId: string, @Param('personaId') personaId: string) {
        return this.grupoService.blockMember(grupoId, personaId);
    }

    // Ver miembros — HU-010
    @Get(':id/miembros')
    getMembers(@Param('id') grupoId: string) {
        return this.grupoService.getMembers(grupoId);
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/aceptar-invitacion')
    aceptarInvitacion(@Param('id') grupoId: string, @Request() req) {
        const authId = req.user.authId || req.user.sub;
        const email = req.user.email;
        return this.grupoService.aceptarInvitacion(grupoId, authId, email);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id/rechazar-invitacion')
    rechazarInvitacion(
        @Param('id') grupoId: string,
        @Request() req
    ) {
        const authId =
            req.user.authId || req.user.sub;

        return this.grupoService
            .rechazarInvitacion(
                grupoId,
                authId
            );
    }
}