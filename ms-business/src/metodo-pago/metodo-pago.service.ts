import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMetodoPagoDto } from './dto/create-metodo-pago.dto';
import { UpdateMetodoPagoDto } from './dto/update-metodo-pago.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { MetodoPago } from './entities/metodo-pago.entity';
import { Repository } from 'typeorm';

@Injectable()
export class MetodoPagoService {
    constructor (@InjectRepository(MetodoPago)
      private readonly metodoPagoRepository: Repository<MetodoPago>,
    ) {}

    async create(createMetodoPagoDto: CreateMetodoPagoDto): Promise<MetodoPago> {
        const metodo_pago = this.metodoPagoRepository.create(createMetodoPagoDto);
        return await this.metodoPagoRepository.save(metodo_pago);
    }

    async findAll(): Promise<MetodoPago[]> {
        return await this.metodoPagoRepository.find({
            relations: ['metodoPagoCiudadano']
        });
    }

    async findOne(id: string): Promise<MetodoPago> {
        const metodo_pago = await this.metodoPagoRepository.findOne({
            where: { id },
            relations: ['metodoPagoCiudadano']
        });
        if (!metodo_pago) {
            throw new NotFoundException(`MetodoPago #${id} no encontrado`);
        }
        return metodo_pago;
    }

    async update(id: string, updateMetodoPagoDto: UpdateMetodoPagoDto): Promise<MetodoPago> {
        const metodo_pago = await this.findOne(id);
        Object.assign(metodo_pago, updateMetodoPagoDto);
        return await this.metodoPagoRepository.save(metodo_pago);
    }

    async remove(id: string): Promise<{ message: string }> {
        const metodo_pago = await this.findOne(id);
        await this.metodoPagoRepository.remove(metodo_pago);
        return { message: `MetodoPago #${id} eliminado correctamente.` };
    }
}
