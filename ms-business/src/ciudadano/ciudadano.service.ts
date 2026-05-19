import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCiudadanoDto } from './dto/create-ciudadano.dto';
import { UpdateCiudadanoDto } from './dto/update-ciudadano.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Ciudadano } from './entities/ciudadano.entity';
import { PersonaService } from '../persona/persona.service';
import { IsNull, Not, Repository } from 'typeorm';
import { MetodoPagoCiudadano } from '../metodo-pago-ciudadano/entities/metodo-pago-ciudadano.entity';
import { MetodoPago, MetodoPagoTipo } from '../metodo-pago/entities/metodo-pago.entity';
import { Persona } from 'src/persona/entities/persona.entity';

@Injectable()
export class CiudadanoService {
    constructor(
        @InjectRepository(Ciudadano)
        private readonly ciudadanoRepository: Repository<Ciudadano>,
        @InjectRepository(MetodoPagoCiudadano)
        private readonly metodoPagoCiudadanoRepository: Repository<MetodoPagoCiudadano>,
        @InjectRepository(MetodoPago)
        private readonly metodoPagoRepository: Repository<MetodoPago>,
        @InjectRepository(Persona)
        private readonly personaRepository: Repository<Persona>,
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

        const ciudadano = this.ciudadanoRepository.create();
        ciudadano.persona = persona;
        const savedCiudadano = await this.ciudadanoRepository.save(ciudadano);

        // --- CREAR BILLETERA VIRTUAL POR DEFECTO ---
        // Buscar si existe el MetodoPago de tipo TARJETA (o crearlo si no existe en la BD)
        let metodoPago = await this.metodoPagoRepository.findOne({
            where: { tipo: MetodoPagoTipo.TARJETA }
        });

        if (!metodoPago) {
            metodoPago = this.metodoPagoRepository.create({
                tipo: MetodoPagoTipo.TARJETA,
                descripcion: 'Tarjeta Virtual TuLlave / Metro (Por defecto)'
            });
            metodoPago = await this.metodoPagoRepository.save(metodoPago);
        }

        // Crear la billetera virtual asociada con un saldo inicial de regalo para pruebas ($20,000)
        const billetera = this.metodoPagoCiudadanoRepository.create({
            ciudadano: savedCiudadano,
            metodoPago: metodoPago,
            saldo: 20000
        });
        await this.metodoPagoCiudadanoRepository.save(billetera);

        if (!savedCiudadano.id) {
            throw new Error('No se pudo generar el ID del ciudadano');
        }

        return await this.findOne(savedCiudadano.id);
    }

    async findAll(): Promise<Ciudadano[]> {
        return await this.ciudadanoRepository.find({
            relations: ['persona', 'direccion', 'metodoPagoCiudadano', 'metodoPagoCiudadano.metodoPago', 'boletos']
        });
    }

    async findOne(id: string): Promise<Ciudadano> {
        const ciudadano = await this.ciudadanoRepository.findOne({
            where: { id },
            relations: ['persona', 'direccion', 'metodoPagoCiudadano', 'metodoPagoCiudadano.metodoPago', 'boletos']
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

    async getDistribucionEtaria() {
        const personas = await this.personaRepository.find({
            where: { ciudadano: Not(IsNull()) },
            relations: ['ciudadano'],
        });

        const rangos = {
            'Menores (0-17)': 0,
            'Jóvenes (18-25)': 0,
            'Adultos jóvenes (26-40)': 0,
            'Adultos (41-60)': 0,
            'Adultos mayores (60+)': 0,
            'Sin información': 0,
        };

        const hoy = new Date();

        for (const persona of personas) {
            if (!persona.birthDate) {
                rangos['Sin información']++;
                continue;
            }
            const edad = hoy.getFullYear() - new Date(persona.birthDate).getFullYear();
            if (edad <= 17) rangos['Menores (0-17)']++;
            else if (edad <= 25) rangos['Jóvenes (18-25)']++;
            else if (edad <= 40) rangos['Adultos jóvenes (26-40)']++;
            else if (edad <= 60) rangos['Adultos (41-60)']++;
            else rangos['Adultos mayores (60+)']++;
        }

        const total = Object.values(rangos).reduce((a, b) => a + b, 0);
        const COLORS: Record<string, string> = {
            'Menores (0-17)': '#6ee7f7',
            'Jóvenes (18-25)': '#818cf8',
            'Adultos jóvenes (26-40)': '#34d399',
            'Adultos (41-60)': '#fbbf24',
            'Adultos mayores (60+)': '#f87171',
            'Sin información': '#64748b',
        };

        return Object.entries(rangos).map(([name, value]) => ({
            name,
            value,
            porcentaje: total > 0 ? Math.round((value / total) * 100) : 0,
            color: COLORS[name],
        }));
    }
}
