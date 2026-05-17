import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Bus } from './entities/bus.entity';
import { CreateBusDto } from './dto/create-bus.dto';
import { UpdateBusDto } from './dto/update-bus.dto';
import { EmpresaService } from '../empresa/empresa.service';
import { Conductor } from 'src/conductor/entities/conductor.entity';

@Injectable()
export class BusService {
    constructor(
        @InjectRepository(Bus)
        private readonly busRepository: Repository<Bus>,
        private readonly empresaService: EmpresaService,
        private readonly dataSource: DataSource,
    ) { }

    async create(createBusDto: CreateBusDto, authId?: string): Promise<Bus> {
        const existing = await this.busRepository.findOne({
            where: { placa: createBusDto.placa }
        });
        if (existing) {
            throw new ConflictException(`Ya existe un bus con la placa ${createBusDto.placa}`);
        }

        let empresa;
        if (createBusDto.empresaId) {
            // Si viene el id explícito, usarlo
            empresa = await this.empresaService.findOne(createBusDto.empresaId);
        } else if (authId) {
            // Auto-asociar la empresa del conductor/admin autenticado
            const conductor = await this.dataSource.getRepository(Conductor).findOne({
                where: { persona: { authId } },
                relations: ['empresas'],
            });
            if (conductor?.empresas?.length) {
                empresa = conductor.empresas[0];
            }
        }

        const bus = this.busRepository.create(createBusDto);
        if (empresa) bus.empresa = empresa;

        return await this.busRepository.save(bus);
    }

    async findAll(): Promise<Bus[]> {
        return await this.busRepository.find({
            relations: ['empresa', 'gps', 'turnos', 'incidentes', 'programaciones']
        });
    }

    async findOne(id: string): Promise<Bus> {
        const bus = await this.busRepository.findOne({
            where: { id },
            relations: ['empresa', 'gps', 'turnos', 'incidentes', 'programaciones']
        });
        if (!bus) {
            throw new NotFoundException(`Bus #${id} no encontrado`);
        }
        return bus;
    }

    async findByPlaca(placa: string): Promise<Bus> {
        const bus = await this.busRepository.findOne({
            where: { placa },
            relations: ['empresa', 'gps', 'turnos', 'incidentes', 'programaciones']
        });
        if (!bus) {
            throw new NotFoundException(`Bus con placa ${placa} no encontrado`);
        }
        return bus;
    }

    // Endpoint especial — última ubicación GPS por bus (HU-ENTR-2-006)
    async getUltimaUbicacion(id: string) {
        const bus = await this.busRepository.findOne({
            where: { id },
            relations: ['gps']
        });
        if (!bus) {
            throw new NotFoundException(`Bus #${id} no encontrado`);
        }
        if (!bus.gps) {
            throw new NotFoundException(`El bus #${id} no tiene GPS registrado`);
        }
        return {
            busId: id,
            placa: bus.placa,
            latitud: bus.gps.latitud,
            longitud: bus.gps.longitud,
            ultimaActualizacion: bus.gps.createdAt
        };
    }

    async update(id: string, updateBusDto: UpdateBusDto): Promise<Bus> {
        const bus = await this.findOne(id);

        // Si se cambia la placa, verificar que no exista
        if (updateBusDto.placa && updateBusDto.placa !== bus.placa) {
            const existing = await this.busRepository.findOne({
                where: { placa: updateBusDto.placa }
            });
            if (existing) {
                throw new ConflictException(`Ya existe un bus con la placa ${updateBusDto.placa}`);
            }
        }

        // Si se cambia la empresa, verificar que existe
        if (updateBusDto.empresaId) {
            const empresa = await this.empresaService.findOne(updateBusDto.empresaId);
            bus.empresa = empresa;
        }

        const updated = Object.assign(bus, updateBusDto);
        return await this.busRepository.save(updated);
    }

    async remove(id: string): Promise<{ message: string }> {
        const bus = await this.findOne(id);
        await this.busRepository.remove(bus);
        return { message: `Bus #${id} eliminado correctamente` };
    }
}