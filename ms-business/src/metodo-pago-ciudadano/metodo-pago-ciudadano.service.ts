import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MetodoPagoCiudadano } from './entities/metodo-pago-ciudadano.entity';
import { CreateMetodoPagoCiudadanoDto } from './dto/create-metodo-pago-ciudadano.dto';
import { UpdateMetodoPagoCiudadanoDto } from './dto/update-metodo-pago-ciudadano.dto';
import { CiudadanoService } from 'src/ciudadano/ciudadano.service';
import { MetodoPagoService } from 'src/metodo-pago/metodo-pago.service';

@Injectable()
export class MetodoPagoCiudadanoService {
    constructor(
        @InjectRepository(MetodoPagoCiudadano)
        private readonly metodoPagoCiudadanoRepository: Repository<MetodoPagoCiudadano>,
        private readonly ciudadanoService: CiudadanoService,
        private readonly metodoPagoService: MetodoPagoService,
    ) {}

    async create(createMetodoPagoCiudadanoDto: CreateMetodoPagoCiudadanoDto): Promise<MetodoPagoCiudadano> {
        const ciudadano = await this.ciudadanoService.findOne(createMetodoPagoCiudadanoDto.ciudadanoId);
        const metodoPago = await this.metodoPagoService.findOne(createMetodoPagoCiudadanoDto.metodoPagoId);

        // Verificar que no exista ya esa combinación
        const existing = await this.metodoPagoCiudadanoRepository.findOne({
            where: {
                ciudadano: { id: createMetodoPagoCiudadanoDto.ciudadanoId },
                metodoPago: { id: createMetodoPagoCiudadanoDto.metodoPagoId }
            }
        });
        if (existing) {
            throw new ConflictException('El ciudadano ya tiene ese método de pago registrado');
        }

        const registro = this.metodoPagoCiudadanoRepository.create();
        registro.ciudadano = ciudadano;
        registro.metodoPago = metodoPago;
        return await this.metodoPagoCiudadanoRepository.save(registro);
    }

    async findAll(): Promise<MetodoPagoCiudadano[]> {
        return await this.metodoPagoCiudadanoRepository.find({
            relations: ['ciudadano', 'metodoPago']
        });
    }

    async findByCiudadano(ciudadanoId: string): Promise<MetodoPagoCiudadano[]> {
        return await this.metodoPagoCiudadanoRepository.find({
            where: { ciudadano: { id: ciudadanoId } },
            relations: ['ciudadano', 'metodoPago']
        });
    }

    async findOne(id: string): Promise<MetodoPagoCiudadano> {
        const registro = await this.metodoPagoCiudadanoRepository.findOne({
            where: { id },
            relations: ['ciudadano', 'metodoPago']
        });
        if (!registro) {
            throw new NotFoundException(`MetodoPagoCiudadano #${id} no encontrado`);
        }
        return registro;
    }

    async update(id: string, updateMetodoPagoCiudadanoDto: UpdateMetodoPagoCiudadanoDto): Promise<MetodoPagoCiudadano> {
        const registro = await this.findOne(id);

        if (updateMetodoPagoCiudadanoDto.ciudadanoId) {
            registro.ciudadano = await this.ciudadanoService.findOne(updateMetodoPagoCiudadanoDto.ciudadanoId);
        }
        if (updateMetodoPagoCiudadanoDto.metodoPagoId) {
            registro.metodoPago = await this.metodoPagoService.findOne(updateMetodoPagoCiudadanoDto.metodoPagoId);
        }

        return await this.metodoPagoCiudadanoRepository.save(registro);
    }

    async remove(id: string): Promise<{ message: string }> {
        const registro = await this.findOne(id);
        await this.metodoPagoCiudadanoRepository.remove(registro);
        return { message: `MetodoPagoCiudadano #${id} eliminado correctamente` };
    }
}