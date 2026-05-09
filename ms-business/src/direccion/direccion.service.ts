import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateDireccionDto } from './dto/create-direccion.dto';
import { UpdateDireccionDto } from './dto/update-direccion.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Direccion } from './entities/direccion.entity';
import { Repository } from 'typeorm';
import { CiudadanoService } from '../ciudadano/ciudadano.service';

@Injectable()
export class DireccionService {
    constructor(@InjectRepository(Direccion)
    private readonly direccionRepository: Repository<Direccion>,
        private readonly ciudadanoService: CiudadanoService,
    ) { }

    async create(createDireccionDto: CreateDireccionDto): Promise<Direccion> {
        // Verificar que el ciudadano existe
        if (!createDireccionDto.ciudadanoId) {
            throw new NotFoundException('El ciudadanoId es obligatorio');
        }
        const ciudadano = await this.ciudadanoService.findOne(createDireccionDto.ciudadanoId);

        if (ciudadano.direccion) {
            throw new ConflictException(`El ciudadano con id ${createDireccionDto.ciudadanoId} ya tiene una direccion registrada`);
        }

        const direccion = this.direccionRepository.create()
        direccion.ciudadano = ciudadano;
        return await this.direccionRepository.save(direccion);
    }

    async findAll(): Promise<Direccion[]> {
        return await this.direccionRepository.find({
            relations: ['ciudadano']
        });
    }

    async findOne(id: string): Promise<Direccion> {
        const direccion = await this.direccionRepository.findOne({
            where: { id },
            relations: ['ciudadano']
        });
        if (!direccion) {
            throw new NotFoundException(`Direccion #${id} no encontrada`);
        }
        return direccion;
    }

    async update(id: string, updateDireccionDto: UpdateDireccionDto): Promise<Direccion> {
        const direccion = await this.findOne(id);

        // Solo actualizamos la persona si llega un personaId nuevo
        if (updateDireccionDto.ciudadanoId) {
            const ciudadano = await this.ciudadanoService.findOne(updateDireccionDto.ciudadanoId);

            // Verificar que esa persona no tenga ya otro ciudadano
            const existing = await this.direccionRepository.findOne({
                where: { ciudadano: { id: updateDireccionDto.ciudadanoId } }
            });
            if (existing && existing.id !== id) {
                throw new ConflictException(`El ciudadano con id ${updateDireccionDto.ciudadanoId} ya tiene una direccion registrada`);
            }

            direccion.ciudadano = ciudadano;
        }

        return await this.direccionRepository.save(direccion);
    }

    async remove(id: string): Promise<{ message: string }> {
        const direccion = await this.findOne(id);
        await this.direccionRepository.remove(direccion);
        return { message: `Direccion #${id} eliminada correctamente.` };
    }
}