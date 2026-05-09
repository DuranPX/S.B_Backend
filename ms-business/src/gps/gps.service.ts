import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateGpsDto } from './dto/create-gp.dto';
import { UpdateGpsDto } from './dto/update-gp.dto';
import { Gps } from './entities/gp.entity';
import { Not, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { BusService } from 'src/bus/bus.service';

@Injectable()
export class GpsService {
  constructor(
    @InjectRepository(Gps)
    private readonly gpsRepository: Repository<Gps>,
    private readonly busService: BusService,
  ) {}

  async create(createGpsDto: CreateGpsDto): Promise<Gps> {
    // Verificar que busId existe
    if (!createGpsDto.busId) {
        throw new NotFoundException('El busId es obligatorio');
    }
      
    // Verificar que el bus existe
    const bus = await this.busService.findOne(createGpsDto.busId);

    // Verificar que no exista otro GPS para ese bus
    const existing = await this.gpsRepository.findOne({
        where: { bus: { id: createGpsDto.busId } }
    });
    if (existing) {
        throw new ConflictException(`El bus #${createGpsDto.busId} ya tiene un GPS registrado`);
    }

    const gps = this.gpsRepository.create();
    gps.bus = bus;
    return await this.gpsRepository.save(gps);
  }

  async findAll(): Promise<Gps[]> {
    return await this.gpsRepository.find({
      relations: ['bus']
    });
  }

  async findOne(id: string): Promise<Gps> {
    const gps = await this.gpsRepository.findOne({
      where: { id },
      relations: ['bus']
    });
    if (!gps) {
      throw new NotFoundException(`Gps #${id} no encontrado`);
    }
    return gps;
  }

  async update(id: string, updateGpsDto: UpdateGpsDto): Promise<Gps> {
    const gps = await this.findOne(id);

    if (updateGpsDto.busId) {
        const bus = await this.busService.findOne(updateGpsDto.busId);

        // Verificar que no exista otro GPS para ese bus
        const existing = await this.gpsRepository.findOne({
            where: { bus: { id: updateGpsDto.busId } }
        });
        if (existing && existing.id !== id) {
            throw new ConflictException(`El bus #${updateGpsDto.busId} ya tiene un GPS registrado`);
        }

        gps.bus = bus;
    }

    const updated = Object.assign(gps, updateGpsDto);
    return await this.gpsRepository.save(updated);
  }

  async remove(id: string): Promise<{ message: string }> {
    const gps = await this.findOne(id);
    await this.gpsRepository.remove(gps);
    return { message: `GPS #${id} eliminado correctamente` };
  }
}
