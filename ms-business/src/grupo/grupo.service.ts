import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Grupo } from './entities/grupo.entity';
import { CreateGrupoDto } from './dto/create-grupo.dto';
import { UpdateGrupoDto } from './dto/update-grupo.dto';
import { GrupoPersona } from '../grupo-persona/entities/grupo-persona.entity';
import { PersonaService } from '../persona/persona.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class GrupoService {
    constructor(
        @InjectRepository(Grupo)
        private readonly grupoRepository: Repository<Grupo>,
        @InjectRepository(GrupoPersona)
        private readonly grupoPersonaRepository: Repository<GrupoPersona>,
        private readonly personaService: PersonaService,
        private readonly eventEmitter: EventEmitter2,
    ) { }

    // ─────────────────────────────────────────────
    // CRUD BÁSICO
    // ─────────────────────────────────────────────

    async create(createGrupoDto: CreateGrupoDto, creadorAuthId: string, creadorEmail: string): Promise<Grupo> {
        const { miembrosIds, ...rest } = createGrupoDto;

        const grupo = this.grupoRepository.create({
            ...rest,
            creadorAuthId,
            fechaCreacion: new Date(),
            esPublico: rest.esPublico ?? false,
        });
        const saved = await this.grupoRepository.save(grupo);

        console.log(
            '[CREATE GRUPO DTO]',
            createGrupoDto
        );

        // Agregar al creador como admin
        const creador = await this.personaService.findByAuthId(creadorAuthId);
        if (creador) {
            const miembroAdmin = this.grupoPersonaRepository.create();
            miembroAdmin.grupo = saved;
            miembroAdmin.persona = creador;
            miembroAdmin.rol = 'admin';
            miembroAdmin.fechaUnion = new Date();
            await this.grupoPersonaRepository.save(miembroAdmin);
        }

        // Agregar los miembros seleccionados y notificarlos
        if (miembrosIds && Array.isArray(miembrosIds)) {
            for (const personaId of miembrosIds) {
                if (personaId === creador?.id) continue;
                try {
                    await this.addMember(saved.id!, personaId);
                } catch {
                    // Si falla uno no detiene la creación del grupo
                }
            }
        }
        return await this.findOne(saved.id!);
    }

    async findAll(nombre?: string): Promise<Grupo[]> {
        return await this.grupoRepository.find({
            where: nombre ? { nombre: ILike(`%${nombre}%`) } : {},
            relations: ['grupoPersonas', 'grupoPersonas.persona'],
        });
    }

    // Solo grupos públicos — para directorio
    async findPublicos(nombre?: string): Promise<Grupo[]> {
        return await this.grupoRepository.find({
            where: nombre
                ? { esPublico: true, nombre: ILike(`%${nombre}%`) }
                : { esPublico: true },
            relations: ['grupoPersonas'],
        });
    }

    async findOne(id: string): Promise<Grupo> {
        const grupo = await this.grupoRepository.findOne({
            where: { id },
            relations: ['grupoPersonas', 'grupoPersonas.persona'],
        });
        if (!grupo) throw new NotFoundException(`Grupo #${id} no encontrado`);
        return grupo;
    }

    // Helper — verifica si el authId es admin del grupo (o el creador)
    private async esAdminDelGrupo(grupoId: string, authId: string): Promise<boolean> {
        const grupo = await this.findOne(grupoId);
        if (grupo.creadorAuthId === authId) return true;

        const persona = await this.personaService.findByAuthId(authId);
        if (!persona) return false;

        const membresia = await this.grupoPersonaRepository.findOne({
            where: { grupo: { id: grupoId }, persona: { id: persona.id } },
        });
        return membresia?.rol === 'admin';
    }

    async update(id: string, updateGrupoDto: UpdateGrupoDto, authId: string): Promise<Grupo> {
        const esAdmin = await this.esAdminDelGrupo(id, authId);
        if (!esAdmin) {
            throw new ForbiddenException('Solo los administradores pueden editar el grupo');
        }
        const grupo = await this.findOne(id);
        const updated = Object.assign(grupo, updateGrupoDto);
        return await this.grupoRepository.save(updated);
    }

    async remove(id: string, authId: string): Promise<{ message: string }> {
        const esAdmin = await this.esAdminDelGrupo(id, authId);
        if (!esAdmin) {
            throw new ForbiddenException('Solo los administradores pueden eliminar el grupo');
        }
        const grupo = await this.findOne(id);
        await this.grupoRepository.remove(grupo);
        return { message: `Grupo "${grupo.nombre}" eliminado correctamente` };
    }

    // ─────────────────────────────────────────────
    // GESTIÓN DE MIEMBROS
    // ─────────────────────────────────────────────

    async addMember(
        grupoId: string,
        personaId: string,
        rol = 'miembro'
    ): Promise<any> {

        const grupo = await this.findOne(grupoId);

        const persona =
            await this.personaService.findOne(personaId);

        if (
            grupo.bloqueados?.includes(persona.authId)
        ) {
            throw new ForbiddenException(
                'Esta persona está bloqueada en el grupo'
            );
        }

        const existing =
            await this.grupoPersonaRepository.findOne({
                where: {
                    grupo: { id: grupoId },
                    persona: { id: personaId }
                }
            });

        if (existing) {
            throw new ConflictException(
                'La persona ya es miembro de este grupo'
            );
        }

        console.log('[ADD MEMBER]', {
            grupoId,
            nombre: grupo.nombre,
            esPublico: grupo.esPublico,
            personaId,
        });

        // ===== GRUPO PRIVADO =====

        if (!grupo.esPublico) {

            grupo.invitacionesPendientes ??= [];

            if (
                grupo.invitacionesPendientes.includes(
                    persona.authId
                )
            ) {
                throw new ConflictException(
                    'Ya existe una invitación pendiente'
                );
            }

            grupo.invitacionesPendientes.push(
                persona.authId
            );

            await this.grupoRepository.save(grupo);

            this.eventEmitter.emit(
                'grupo.invitacion',
                {
                    authId: persona.authId,
                    grupoId,
                    nombreGrupo: grupo.nombre
                }
            );

            return {
                tipo: 'INVITACION',
                mensaje:
                    'Invitación enviada correctamente'
            };
        }

        // ===== GRUPO PUBLICO =====

        const grupoPersona =
            this.grupoPersonaRepository.create();

        grupoPersona.grupo = grupo;
        grupoPersona.persona = persona;
        grupoPersona.rol = rol;
        grupoPersona.fechaUnion = new Date();

        const saved =
            await this.grupoPersonaRepository.save(
                grupoPersona
            );

        await this.registrarLog(
            grupo,
            'MIEMBRO_AGREGADO',
            `${persona.firstName} ${persona.lastName}`,
            grupo.creadorAuthId || '',
        );

        console.log(
            '[GRUPO] Lanzando evento grupo.miembro_agregado',
            {
                grupoId,
                authId: persona.authId,
                nombreGrupo: grupo.nombre
            }
        );

        this.eventEmitter.emit(
            'grupo.miembro_agregado',
            {
                grupoId,
                nombreGrupo: grupo.nombre,
                authId: persona.authId,
                mensaje:
                    `Fuiste agregado al grupo "${grupo.nombre}"`
            }
        );

        return saved;
    }

    async joinPublicGroup(grupoId: string, authId: string): Promise<GrupoPersona> {
        const grupo = await this.findOne(grupoId);

        if (!grupo.esPublico) {
            throw new ForbiddenException('Este grupo es privado');
        }

        const persona = await this.personaService.findByAuthId(authId);
        if (!persona) throw new NotFoundException('Persona no encontrada');

        if (grupo.bloqueados?.includes(authId)) {
            throw new ForbiddenException('Estás bloqueado en este grupo');
        }

        const existing = await this.grupoPersonaRepository.findOne({
            where: { grupo: { id: grupoId }, persona: { id: persona.id } }
        });
        if (existing) throw new ConflictException('Ya eres miembro de este grupo');

        const grupoPersona = this.grupoPersonaRepository.create();
        grupoPersona.grupo = grupo;
        grupoPersona.persona = persona;
        grupoPersona.rol = 'miembro';
        grupoPersona.fechaUnion = new Date();
        const saved = await this.grupoPersonaRepository.save(grupoPersona);

        await this.registrarLog(
            grupo,
            'SE_UNIÓ',
            `${persona.firstName} ${persona.lastName}`,
            authId,
        );

        console.log('[GRUPO] Emitiendo grupo.miembro_unido', {
            grupoId,
            nombreGrupo: grupo.nombre,
            nombrePersona: `${persona.firstName} ${persona.lastName}`,
            creadorAuthId: grupo.creadorAuthId,
        });

        // Notificar a admins
        this.eventEmitter.emit('grupo.miembro_unido', {
            grupoId,
            nombreGrupo: grupo.nombre,
            nombrePersona: `${persona.firstName} ${persona.lastName}`,
            creadorAuthId: grupo.creadorAuthId,
        });

        console.log('[GRUPO] Emitiendo grupo.miembro_unido_bienvenida', {
            authId,
            nombreGrupo: grupo.nombre,
        });

        // Notificar bienvenida al usuario que se unió
        this.eventEmitter.emit(
            'grupo.miembro_unido_bienvenida',
            {
                authId,
                grupoId,
                nombreGrupo: grupo.nombre,
                mensaje:
                    `¡Bienvenido al grupo "${grupo.nombre}"!`,
            }
        );

        return saved;
    }

    async leaveGroup(grupoId: string, authId: string): Promise<{ message: string }> {
        const persona = await this.personaService.findByAuthId(authId);
        if (!persona) throw new NotFoundException('Persona no encontrada');

        const registro = await this.grupoPersonaRepository.findOne({
            where: { grupo: { id: grupoId }, persona: { id: persona.id } },
            relations: ['grupo'],
        });
        if (!registro) throw new NotFoundException('No eres miembro de este grupo');

        await this.registrarLog(
            registro.grupo!,
            'SALIÓ_DEL_GRUPO',
            `${persona.firstName} ${persona.lastName}`,
            authId,
        );

        const nombreGrupo = registro.grupo?.nombre;
        await this.grupoPersonaRepository.remove(registro);

        // Notificar a admins
        this.eventEmitter.emit('grupo.miembro_salio', {
            grupoId,
            nombreGrupo,
            nombrePersona: `${persona.firstName} ${persona.lastName}`,
            creadorAuthId: registro.grupo?.creadorAuthId,
        });

        return { message: `Saliste del grupo "${nombreGrupo}" exitosamente` };
    }

    async removeMember(grupoId: string, personaId: string): Promise<{ message: string }> {
        const registro = await this.grupoPersonaRepository.findOne({
            where: { grupo: { id: grupoId }, persona: { id: personaId } },
            relations: ['persona', 'grupo'],
        });
        if (!registro) throw new NotFoundException('La persona no es miembro de este grupo');

        const nombrePersona = `${registro.persona?.firstName} ${registro.persona?.lastName}`;
        const grupoObj = await this.findOne(grupoId);
        await this.registrarLog(grupoObj, 'MIEMBRO_REMOVIDO', nombrePersona, grupoObj.creadorAuthId || '');

        const authId = registro.persona?.authId;
        const nombreGrupo = registro.grupo?.nombre;
        await this.grupoPersonaRepository.remove(registro);

        // Notificar al miembro removido
        if (authId) {
            this.eventEmitter.emit('grupo.miembro_removido', {
                grupoId,
                nombreGrupo,
                authId,
                mensaje: `Fuiste removido del grupo "${nombreGrupo}"`,
            });
        }

        return { message: 'Miembro removido exitosamente' };
    }

    async promoteMember(grupoId: string, personaId: string): Promise<GrupoPersona> {
        const registro = await this.grupoPersonaRepository.findOne({
            where: { grupo: { id: grupoId }, persona: { id: personaId } },
        });
        if (!registro) throw new NotFoundException('La persona no es miembro de este grupo');
        registro.rol = 'admin';
        await this.grupoPersonaRepository.save(registro);
        const grupoObj = await this.findOne(grupoId);
        const persona = await this.personaService.findOne(personaId);
        await this.registrarLog(grupoObj, 'PROMOVIDO_A_ADMIN', `${persona.firstName} ${persona.lastName}`, grupoObj.creadorAuthId || '');

        return registro;
    }

    async blockMember(grupoId: string, personaId: string): Promise<{ message: string }> {
        const grupo = await this.findOne(grupoId);
        const persona = await this.personaService.findOne(personaId);

        // Remover del grupo
        const registro = await this.grupoPersonaRepository.findOne({
            where: { grupo: { id: grupoId }, persona: { id: personaId } },
        });
        if (registro) await this.grupoPersonaRepository.remove(registro);

        // Agregar a bloqueados
        if (!grupo.bloqueados) grupo.bloqueados = [];
        if (!grupo.bloqueados.includes(persona.authId)) {
            grupo.bloqueados.push(persona.authId);
            await this.grupoRepository.save(grupo);
        }

        await this.registrarLog(
            grupo,
            'BLOQUEADO',
            `${persona.firstName} ${persona.lastName}`,
            grupo.creadorAuthId || '',
        );

        this.eventEmitter.emit(
            'grupo.usuario_bloqueado',
            {
                authId: persona.authId,
                grupoId: grupo.id,
                nombreGrupo: grupo.nombre,
            }
        );

        return { message: 'Usuario bloqueado del grupo' };
    }

    async getMembers(grupoId: string): Promise<GrupoPersona[]> {
        await this.findOne(grupoId);
        return await this.grupoPersonaRepository.find({
            where: { grupo: { id: grupoId } },
            relations: ['persona'],
            order: { fechaUnion: 'ASC' },
        });
    }

    async getGruposByPersona(authId: string, email?: string): Promise<GrupoPersona[]> {
        let persona = await this.personaService.findByAuthId(authId);

        // Fallback: buscar por email si no se encuentra por authId
        if (!persona && email) {
            persona = await this.personaService.findByEmail(email);
            // Si se encuentra por email, actualizar el authId para futuras consultas
            if (persona) {
                await this.personaService.updateAuthId(persona.id, authId);
            }
        }

        if (!persona) return [];

        // OJO: no pedir 'grupo.grupoPersonas' aquí. Esa relación anidada obliga
        // a TypeORM a auto-unir grupo_persona -> grupo -> grupo_persona, y al
        // hidratar varias filas raíz a la vez termina dejando `grupo` en
        // undefined para algunas filas (confirmado en logs). No se necesita
        // para "Mis Grupos": esta vista solo usa nombre/descripcion/esPublico/imagen.
        return await this.grupoPersonaRepository.find({
            where: { persona: { id: persona.id } },
            relations: ['grupo'],
        });
    }

    async aceptarInvitacion(grupoId: string, authId: string, email?: string): Promise<GrupoPersona> {
        console.log('[ACEPTAR 1] buscando persona, authId:', authId);

        let persona = await this.personaService.findByAuthId(authId);
        if (!persona && email) {
            persona = await this.personaService.findByEmail(email);
            if (persona) await this.personaService.updateAuthId(persona.id, authId);
        }
        console.log('[ACEPTAR 2] persona encontrada:', persona?.id, persona?.firstName);

        if (!persona) throw new NotFoundException('Persona no encontrada');

        const existing = await this.grupoPersonaRepository.findOne({
            where: { grupo: { id: grupoId }, persona: { id: persona.id } }
        });
        console.log('[ACEPTAR 3] existing:', existing?.id);

        if (existing) throw new ConflictException('Ya eres miembro del grupo');

        const grupoPersona = this.grupoPersonaRepository.create();
        grupoPersona.grupo = { id: grupoId } as any;
        grupoPersona.persona = persona;
        grupoPersona.rol = 'miembro';
        grupoPersona.fechaUnion = new Date();

        console.log('[ACEPTAR 4] guardando grupoPersona...');
        const saved = await this.grupoPersonaRepository.save(grupoPersona);
        console.log('[ACEPTAR 5] guardado:', saved.id);

        // Remover de invitacionesPendientes
        const grupo = await this.findOne(grupoId);
        grupo.invitacionesPendientes = (grupo.invitacionesPendientes || []).filter(x => x !== authId);
        await this.grupoRepository.save(grupo);
        console.log('[ACEPTAR 6] invitación removida');

        await this.registrarLog(
            grupo,
            'INVITACIÓN_ACEPTADA',
            `${persona.firstName} ${persona.lastName}`,
            authId,
        );

        this.eventEmitter.emit('grupo.miembro_unido', {
            grupoId,
            nombreGrupo: grupo.nombre,
            nombrePersona: `${persona.firstName} ${persona.lastName}`,
            creadorAuthId: grupo.creadorAuthId,
        });

        this.eventEmitter.emit('grupo.miembro_unido_bienvenida', {
            authId,
            grupoId,
            nombreGrupo: grupo.nombre,
            mensaje: `¡Bienvenido al grupo "${grupo.nombre}"!`,
        });

        return saved;
    }

    async rechazarInvitacion(
        grupoId: string,
        authId: string,
    ) {

        const grupo = await this.findOne(grupoId);

        grupo.invitacionesPendientes =
            (grupo.invitacionesPendientes || [])
                .filter(
                    x => x !== authId
                );

        await this.grupoRepository.save(grupo);

        return {
            success: true,
            mensaje: 'Invitación rechazada',
        };
    }

    async getMisInvitaciones(authId: string, email?: string) {
        // Resolver authId real por si hay desincronización con MySQL
        let persona = await this.personaService.findByAuthId(authId);
        if (!persona && email) {
            persona = await this.personaService.findByEmail(email);
            if (persona) {
                await this.personaService.updateAuthId(persona.id, authId);
                // El authId ya quedó actualizado en MySQL, futuras invitaciones usarán el nuevo
            }
        }

        const grupos = await this.grupoRepository.find();
        return grupos
            .filter(g => g.invitacionesPendientes?.includes(authId))
            .map(g => ({
                grupoId: g.id,
                nombre: g.nombre,
                descripcion: g.descripcion,
            }));
    }

    private async registrarLog(
        grupo: Grupo,
        accion: string,
        personaNombre: string,
        realizadoPorAuthId: string,
    ) {
        const realizadoPor = await this.personaService.findByAuthId(realizadoPorAuthId);
        const realizadoPorNombre = realizadoPor
            ? `${realizadoPor.firstName} ${realizadoPor.lastName}`
            : 'Sistema';

        if (!grupo.logMembresia) grupo.logMembresia = [];
        grupo.logMembresia.unshift({ // unshift para que el más reciente quede primero
            accion,
            personaNombre,
            realizadoPorNombre,
            fecha: new Date().toISOString(),
        });

        // Mantener solo los últimos 50 registros
        if (grupo.logMembresia.length > 50) {
            grupo.logMembresia = grupo.logMembresia.slice(0, 50);
        }

        await this.grupoRepository.save(grupo);
    }

    async getLog(grupoId: string) {
        const grupo = await this.findOne(grupoId);
        return grupo.logMembresia || [];
    }
}