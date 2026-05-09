import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCiudadanoDto } from './dto/create-ciudadano.dto';
import { UpdateCiudadanoDto } from './dto/update-ciudadano.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Ciudadano } from './entities/ciudadano.entity';
import { PersonaService } from '../persona/persona.service';
import { Repository } from 'typeorm';

@Injectable()
export class CiudadanoService {
    constructor(@InjectRepository(Ciudadano)
    private readonly ciudadanoRepository: Repository<Ciudadano>,
        private readonly personaService: PersonaService,
    ) { }

    async create(createCiudadanoDto: CreateCiudadanoDto): Promise<Ciudadano> {
        // Verificar que la persona existe
        if (!createCiudadanoDto.personaId) {
            throw new NotFoundException('El personaId es obligatorio');
        }
        const persona = await this.personaService.findOne(createCiudadanoDto.personaId);

        if (persona.ciudadano) {
            throw new ConflictException(`La persona con id ${createCiudadanoDto.personaId} ya tiene un ciudadano registrado`);
        }

        const ciudadano = this.ciudadanoRepository.create()
        ciudadano.persona = persona;
        return await this.ciudadanoRepository.save(ciudadano);
    }

    async findAll(): Promise<Ciudadano[]> {
        return await this.ciudadanoRepository.find({
            relations: ['persona', 'direccion', 'metodoPagoCiudadano', 'boletos']
        });
    }

    async findOne(id: string): Promise<Ciudadano> {
        const ciudadano = await this.ciudadanoRepository.findOne({
            where: { id },
            relations: ['persona', 'direccion', 'metodoPagoCiudadano', 'boletos']
        });
        if (!ciudadano) {
            throw new NotFoundException(`Ciudadano #${id} no encontrado`);
        }
        return ciudadano;
    }

    async update(id: string, updateCiudadanoDto: UpdateCiudadanoDto): Promise<Ciudadano> {
        const ciudadano = await this.findOne(id);

        // Solo actualizamos la persona si llega un personaId nuevo
        if (updateCiudadanoDto.personaId) {
            const persona = await this.personaService.findOne(updateCiudadanoDto.personaId);

            // Verificar que esa persona no tenga ya otro ciudadano
            const existing = await this.ciudadanoRepository.findOne({
                where: { persona: { id: updateCiudadanoDto.personaId } }
            });
            if (existing && existing.id !== id) {
                throw new ConflictException(`La persona con id ${updateCiudadanoDto.personaId} ya tiene un ciudadano registrado`);
            }

            ciudadano.persona = persona;
        }

        return await this.ciudadanoRepository.save(ciudadano);
    }

    async remove(id: string): Promise<{ message: string }> {
        const ciudadano = await this.findOne(id);
        await this.ciudadanoRepository.remove(ciudadano);
        return { message: `Ciudadano #${id} eliminado correctamente.` };
    }
}
