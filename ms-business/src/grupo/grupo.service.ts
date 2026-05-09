import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Grupo } from './entities/grupo.entity';
import { CreateGrupoDto } from './dto/create-grupo.dto';
import { UpdateGrupoDto } from './dto/update-grupo.dto';

@Injectable()
export class GrupoService {
    constructor(
        @InjectRepository(Grupo)
        private readonly grupoRepository: Repository<Grupo>,
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
}