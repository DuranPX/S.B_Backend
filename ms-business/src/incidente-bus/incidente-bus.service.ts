// src/incidente-bus/incidente-bus.service.ts
import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IncidenteBus } from './entities/incidente-bus.entity';
import { CreateIncidenteBusDto } from './dto/create-incidente-bus.dto';
import { IncidenteService } from '../incidente/incidente.service';

@Injectable()
export class IncidenteBusService {
  constructor(
    @InjectRepository(IncidenteBus)
    private readonly incidenteBusRepository: Repository<IncidenteBus>,
    private readonly incidenteService: IncidenteService,
  ) {}

  async create(createIncidenteBusDto: CreateIncidenteBusDto): Promise<IncidenteBus> {
    const { incidente_id, bus_id } = createIncidenteBusDto;

    // Verificamos que el incidente existe
    await this.incidenteService.findOne(incidente_id);

    const incidenteBus = this.incidenteBusRepository.create({
      incidente: { id: incidente_id } as any,
      bus: { id: bus_id } as any,
    });

    return await this.incidenteBusRepository.save(incidenteBus);
  }

  async findAll(): Promise<IncidenteBus[]> {
    return await this.incidenteBusRepository.find({
      relations: ['incidente', 'bus', 'fotos'],
    });
  }

  async findOne(id: string): Promise<IncidenteBus> {
    const incidenteBus = await this.incidenteBusRepository.findOne({
      where: { id },
      relations: ['incidente', 'bus', 'fotos'],
    });

    if (!incidenteBus) {
      throw new NotFoundException(`IncidenteBus con id ${id} no encontrado`);
    }

    return incidenteBus;
  }

  async findByIncidente(incidente_id: string): Promise<IncidenteBus[]> {
    return await this.incidenteBusRepository.find({
      where: { incidente: { id: incidente_id } as any },
      relations: ['bus', 'fotos'],
    });
  }

  async reportarConFotos(
    createIncidenteBusDto: CreateIncidenteBusDto,
    fotos: Express.Multer.File[],
  ): Promise<IncidenteBus> {
    const incidenteBus = await this.create(createIncidenteBusDto);

    // Guardamos las urls de las fotos asociadas al incidenteBus
    if (fotos && fotos.length > 0) {
      const fotoEntities = fotos.map((foto) =>
        this.incidenteBusRepository.manager.create('Foto', {
          url: foto.path,
          incidenteBus: { id: incidenteBus.id },
        }),
      );
      await this.incidenteBusRepository.manager.save('Foto', fotoEntities);
    }

    return await this.findOne(incidenteBus.id);
  }

  async remove(id: string): Promise<void> {
    const incidenteBus = await this.findOne(id);
    await this.incidenteBusRepository.remove(incidenteBus);
  }
}