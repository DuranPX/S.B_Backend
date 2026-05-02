import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Empresa } from './entities/empresa.entity';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';

@Injectable()
export class EmpresaService {
    constructor(
        @InjectRepository(Empresa)
        private readonly empresaRepository: Repository<Empresa>,
    ) {}

    async create(createEmpresaDto: CreateEmpresaDto): Promise<Empresa> {
        // Verificar NIT duplicado
        const existing = await this.empresaRepository.findOne({
            where: { nit: createEmpresaDto.nit }
        });
        if (existing) {
            throw new ConflictException(`Ya existe una empresa con el NIT ${createEmpresaDto.nit}`);
        }

        const empresa = this.empresaRepository.create(createEmpresaDto);
        return await this.empresaRepository.save(empresa);
    }

    async findAll(): Promise<Empresa[]> {
        return await this.empresaRepository.find({
            relations: ['bus']
        });
    }

    async findOne(id: number): Promise<Empresa> {
        const empresa = await this.empresaRepository.findOne({
            where: { id },
            relations: ['bus']
        });
        if (!empresa) {
            throw new NotFoundException(`Empresa #${id} no encontrada`);
        }
        return empresa;
    }

    async update(id: number, updateEmpresaDto: UpdateEmpresaDto): Promise<Empresa> {
        const empresa = await this.findOne(id);

        // Si se está cambiando el NIT, verificar que no exista
        if (updateEmpresaDto.nit && updateEmpresaDto.nit !== empresa.nit) {
            const existing = await this.empresaRepository.findOne({
                where: { nit: updateEmpresaDto.nit }
            });
            if (existing) {
                throw new ConflictException(`Ya existe una empresa con el NIT ${updateEmpresaDto.nit}`);
            }
        }

        const updated = Object.assign(empresa, updateEmpresaDto);
        return await this.empresaRepository.save(updated);
    }

    async remove(id: number): Promise<{ message: string }> {
        const empresa = await this.findOne(id);

        if (empresa.bus && empresa.bus.length > 0) {
            throw new ConflictException('No se puede eliminar la empresa porque tiene buses asociados');
        }

        await this.empresaRepository.remove(empresa);
        return { message: `Empresa #${id} eliminada correctamente` };
    }
}
