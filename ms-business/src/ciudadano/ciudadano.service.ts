import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCiudadanoDto } from './dto/create-ciudadano.dto';
import { UpdateCiudadanoDto } from './dto/update-ciudadano.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Ciudadano } from './entities/ciudadano.entity';
import { PersonaService } from '../persona/persona.service';
import { Repository } from 'typeorm';
import { MetodoPagoCiudadano } from '../metodo-pago-ciudadano/entities/metodo-pago-ciudadano.entity';
import { MetodoPago, MetodoPagoTipo } from '../metodo-pago/entities/metodo-pago.entity';
import { Persona } from 'src/persona/entities/persona.entity';
import { Boleto } from 'src/boleto/entities/boleto.entity';
import { Programacion } from 'src/programacion/entities/programacion.entity';

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
        @InjectRepository(Boleto)
        private readonly boletoRepository: Repository<Boleto>,
        @InjectRepository(Programacion)
        private readonly programacionRepository: Repository<Programacion>,
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

    async getDistribucionEtaria(filtros?: {
        rutaId?: string;
        fechaInicio?: string;
        fechaFin?: string;
    }) {
        const COLORS: Record<string, string> = {
            'Menores (0-17)': '#6ee7f7',
            'Jóvenes (18-25)': '#818cf8',
            'Adultos jóvenes (26-40)': '#34d399',
            'Adultos (41-60)': '#fbbf24',
            'Adultos mayores (60+)': '#f87171',
            'Sin información': '#64748b',
        };

        const rangosBase = {
            'Menores (0-17)': 0,
            'Jóvenes (18-25)': 0,
            'Adultos jóvenes (26-40)': 0,
            'Adultos (41-60)': 0,
            'Adultos mayores (60+)': 0,
            'Sin información': 0,
        };

        // Parsea "YYYY-MM-DD" sin desfase de zona horaria (PostgreSQL date → string)
        const parsearFecha = (raw: Date | string | null): Date | null => {
            if (!raw) return null;
            const str = typeof raw === 'string' ? raw : raw.toISOString().split('T')[0];
            const parts = str.split('T')[0].split('-');
            if (parts.length !== 3) return null;
            return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        };

        const calcularRango = (birthDate: Date | string | null, hoy: Date): string => {
            const fecha = parsearFecha(birthDate as any);
            if (!fecha) return 'Sin información';
            let edad = hoy.getFullYear() - fecha.getFullYear();
            if (
                hoy.getMonth() < fecha.getMonth() ||
                (hoy.getMonth() === fecha.getMonth() && hoy.getDate() < fecha.getDate())
            ) edad--;
            if (edad <= 17) return 'Menores (0-17)';
            if (edad <= 25) return 'Jóvenes (18-25)';
            if (edad <= 40) return 'Adultos jóvenes (26-40)';
            if (edad <= 60) return 'Adultos (41-60)';
            return 'Adultos mayores (60+)';
        };

        const hoy = new Date();

        const contarCiudadanosUnicos = async (
            rutaId?: string,
            fechaInicio?: string,
            fechaFin?: string,
        ): Promise<Record<string, number>> => {
            const query = this.boletoRepository
                .createQueryBuilder('boleto')
                .innerJoin('boleto.ciudadano', 'ciudadano')
                .innerJoin('ciudadano.persona', 'persona')
                .innerJoin('boleto.programacion', 'programacion')
                .innerJoin('programacion.ruta', 'ruta')
                // Seleccionar solo lo necesario + deduplicar por ciudadano
                .select(['ciudadano.id AS ciudadano_id', 'persona.birth_date AS birth_date'])
                .distinct(true);

            if (rutaId) {
                query.andWhere('ruta.id = :rutaId', { rutaId });
            }
            if (fechaInicio) {
                query.andWhere('programacion.fecha >= :fechaInicio', { fechaInicio });
            }
            if (fechaFin) {
                query.andWhere('programacion.fecha <= :fechaFin', { fechaFin });
            }

            const rows = await query.getRawMany();

            const rangos = { ...rangosBase };
            // Deduplicar en memoria también por si el DISTINCT no cubre todos los casos
            const vistos = new Set<string>();
            for (const row of rows) {
                if (vistos.has(row.ciudadano_id)) continue;
                vistos.add(row.ciudadano_id);
                const rango = calcularRango(row.birth_date, hoy);
                rangos[rango]++;
            }
            return rangos;
        };

        // ── Con filtros ──
        if (filtros?.rutaId || filtros?.fechaInicio || filtros?.fechaFin) {
            const rangos = await contarCiudadanosUnicos(
                filtros.rutaId, filtros.fechaInicio, filtros.fechaFin,
            );

            // Mes anterior con los mismos filtros
            const mesAnteriorInicio = filtros.fechaInicio
                ? new Date(new Date(filtros.fechaInicio).setMonth(new Date(filtros.fechaInicio).getMonth() - 1))
                    .toISOString().split('T')[0]
                : new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().split('T')[0];

            const mesAnteriorFin = filtros.fechaFin
                ? new Date(new Date(filtros.fechaFin).setMonth(new Date(filtros.fechaFin).getMonth() - 1))
                    .toISOString().split('T')[0]
                : new Date(new Date().getFullYear(), new Date().getMonth(), 0).toISOString().split('T')[0];

            const rangosMesAnterior = await contarCiudadanosUnicos(
                filtros.rutaId, mesAnteriorInicio, mesAnteriorFin,
            );

            const total = Object.values(rangos).reduce((a, b) => a + b, 0);
            const totalMesAnterior = Object.values(rangosMesAnterior).reduce((a, b) => a + b, 0);

            return Object.entries(rangos).map(([name, value]) => {
                const pctActual = total > 0 ? Math.round((value / total) * 100) : 0;
                const valorAnterior = rangosMesAnterior[name] ?? 0;
                const pctAnterior = totalMesAnterior > 0 ? Math.round((valorAnterior / totalMesAnterior) * 100) : 0;
                return {
                    name,
                    value,
                    porcentaje: pctActual,
                    color: COLORS[name],
                    variacion: pctActual - pctAnterior,
                    valorMesAnterior: valorAnterior,
                };
            });
        }

        // ── Sin filtros: todos los ciudadanos registrados ──
        const personas = await this.personaRepository.find({ relations: ['ciudadano'] });
        const personasConCiudadano = personas.filter(p => p.ciudadano);

        const rangos = { ...rangosBase };
        for (const persona of personasConCiudadano) {
            rangos[calcularRango(persona.birthDate ?? null, hoy)]++;
        }

        const total = Object.values(rangos).reduce((a, b) => a + b, 0);

        return Object.entries(rangos).map(([name, value]) => ({
            name,
            value,
            porcentaje: total > 0 ? Math.round((value / total) * 100) : 0,
            color: COLORS[name],
            variacion: 0,
            valorMesAnterior: 0,
        }));
    }
    // ── Agregar estos métodos al CiudadanoService existente ──

// Endpoint que n8n llama en el cron de clima
async findConAlertasActivas(): Promise<Ciudadano[]> {
  return this.ciudadanoRepository.find({
    where: { alertaClimaActiva: true },
    relations: ['persona'],
  });
}

// El ciudadano activa/desactiva desde su perfil
async updateAlertaClima(
  id: string,
  activa: boolean,
  horarioViaje?: string,
): Promise<Ciudadano> {
  const ciudadano = await this.ciudadanoRepository.findOne({
    where: { id },
  });

  if (!ciudadano) {
    throw new NotFoundException(`Ciudadano con id ${id} no encontrado`);
  }

  ciudadano.alertaClimaActiva = activa;
  if (horarioViaje !== undefined) ciudadano.horarioViaje = horarioViaje;

  return this.ciudadanoRepository.save(ciudadano);
}
}
