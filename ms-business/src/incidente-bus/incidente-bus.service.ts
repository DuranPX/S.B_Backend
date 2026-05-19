// Reemplaza el archivo completo:
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IncidenteBus } from './entities/incidente-bus.entity';
import { CreateIncidenteBusDto } from './dto/create-incidente-bus.dto';
import { IncidenteService } from '../incidente/incidente.service';
import { Turno } from '../turno/entities/turno.entity';
import { Conductor } from '../conductor/entities/conductor.entity';

@Injectable()
export class IncidenteBusService {
  constructor(
    @InjectRepository(IncidenteBus)
    private readonly incidenteBusRepository: Repository<IncidenteBus>,
    @InjectRepository(Turno)
    private readonly turnoRepository: Repository<Turno>,
    @InjectRepository(Conductor)
    private readonly conductorRepository: Repository<Conductor>,
    private readonly incidenteService: IncidenteService,
  ) {}

  async create(createIncidenteBusDto: CreateIncidenteBusDto): Promise<IncidenteBus> {
    const { incidente_id, bus_id } = createIncidenteBusDto;
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
    authId: string,
  ): Promise<IncidenteBus> {
    // Validar que el conductor tiene un turno EN_CURSO
    const conductor = await this.conductorRepository.findOne({
      where: { persona: { authId } },
      relations: ['persona'],
    });

    if (!conductor) {
      throw new NotFoundException('No se encontró un conductor asociado a este usuario');
    }

    const turnoActivo = await this.turnoRepository.findOne({
      where: {
        conductor: { id: conductor.id },
        estado: 'EN_CURSO',
      },
    });

    if (!turnoActivo) {
      throw new BadRequestException(
        'No puedes reportar un incidente sin tener un turno en curso',
      );
    }

    const incidenteBus = await this.create(createIncidenteBusDto);

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