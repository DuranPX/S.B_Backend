import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Grupo } from './entities/grupo.entity';
import { CreateGrupoDto } from './dto/create-grupo.dto';
import { UpdateGrupoDto } from './dto/update-grupo.dto';
import { GrupoPersona } from 'src/grupo-persona/entities/grupo-persona.entity';
import { PersonaService } from 'src/persona/persona.service';

@Injectable()
export class GrupoService {
    constructor(
        @InjectRepository(Grupo)
        private readonly grupoRepository: Repository<Grupo>,
        @InjectRepository(GrupoPersona)
        private readonly grupoPersonaRepository: Repository<GrupoPersona>,
        private readonly personaService: PersonaService,
    ) {}

    async create(createGrupoDto: CreateGrupoDto): Promise<Grupo> {
        const grupo = this.grupoRepository.create({
            ...createGrupoDto,
            fechaCreacion: createGrupoDto.fechaCreacion || new Date()
        });
        return await this.grupoRepository.save(grupo);
    }

    async findAll(): Promise<Grupo[]> {
        return await this.grupoRepository.find({
            relations: ['grupoPersonas', 'grupoPersonas.persona']
        });
    }

    async findOne(id: string): Promise<Grupo> {
        const grupo = await this.grupoRepository.findOne({
            where: { id },
            relations: ['grupoPersonas', 'grupoPersonas.persona']
        });
        if (!grupo) {
            throw new NotFoundException(`Grupo #${id} no encontrado`);
        }
        return grupo;
    }

    async update(id: string, updateGrupoDto: UpdateGrupoDto): Promise<Grupo> {
        const grupo = await this.findOne(id);
        const updated = Object.assign(grupo, updateGrupoDto);
        return await this.grupoRepository.save(updated);
    }

    async remove(id: string): Promise<{ message: string }> {
        const grupo = await this.findOne(id);
        await this.grupoRepository.remove(grupo);
        return { message: `Grupo #${id} eliminado correctamente` };
    }

    // ─────────────────────────────────────────────
    // GESTIÓN DE MIEMBROS
    // ─────────────────────────────────────────────

    async addMember(grupoId: string, personaId: string): Promise<GrupoPersona> {
        // Verificar que el grupo existe
        const grupo = await this.findOne(grupoId);

        // Verificar que la persona existe
        const persona = await this.personaService.findOne(personaId);

        // Verificar que la persona no sea ya miembro del grupo
        const existing = await this.grupoPersonaRepository.findOne({
            where: {
                grupo: { id: grupoId },
                persona: { id: personaId }
            }
        });
        if (existing) {
            throw new ConflictException('La persona ya es miembro de este grupo');
        }

        const grupoPersona = this.grupoPersonaRepository.create();
        grupoPersona.grupo = grupo;
        grupoPersona.persona = persona;
        return await this.grupoPersonaRepository.save(grupoPersona);
    }

    async removeMember(grupoId: string, personaId: string): Promise<{ message: string }> {
        // Verificar que existe esa membresía
        const registro = await this.grupoPersonaRepository.findOne({
            where: {
                grupo: { id: grupoId },
                persona: { id: personaId }
            }
        });
        if (!registro) {
            throw new NotFoundException('La persona no es miembro de este grupo');
        }

        await this.grupoPersonaRepository.remove(registro);
        return { message: 'Miembro removido del grupo exitosamente' };
    }

    async getMembers(grupoId: string): Promise<GrupoPersona[]> {
        // Verificar que el grupo existe
        await this.findOne(grupoId);

        return await this.grupoPersonaRepository.find({
            where: { grupo: { id: grupoId } },
            relations: ['persona']
        });
    }

    async getGruposByPersona(personaId: string): Promise<GrupoPersona[]> {
        // Verificar que la persona existe
        await this.personaService.findOne(personaId);

        return await this.grupoPersonaRepository.find({
            where: { persona: { id: personaId } },
            relations: ['grupo']
        });
    }
}