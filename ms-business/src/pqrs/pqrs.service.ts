import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pqrs } from './entities/pqrs.entity';
import { CreatePqrsDto, UpdatePqrsEstadoDto } from './dto/pqrs.dto';
import { PqrsFoto } from './entities/pqrs-foto.entity';

@Injectable()
export class PqrsService {
  constructor(
    @InjectRepository(Pqrs)
    private readonly pqrsRepository: Repository<Pqrs>,
    @InjectRepository(PqrsFoto)
    private fotoRepo: Repository<PqrsFoto>,
  ) { }

  async create(
    dto: CreatePqrsDto,
    archivos?: Express.Multer.File[],
  ): Promise<Pqrs> {

    const existe = await this.pqrsRepository.findOne({
      where: {
        radicado: dto.radicado,
      },
    });

    if (existe) {
      throw new ConflictException(
        `Ya existe una PQRS con radicado ${dto.radicado}`,
      );
    }

    const pqrs = this.pqrsRepository.create(dto);

    if (archivos?.length) {

      pqrs.fotos = archivos.map((archivo, i) => {

        const foto = new PqrsFoto();

        foto.nombreOriginal = archivo.originalname;
        foto.mimeType = archivo.mimetype;
        foto.datos = archivo.buffer;
        foto.orden = i + 1;

        return foto;
      });
    }

    try {
      return await this.pqrsRepository.save(pqrs);
    } catch (error) {

      if (error.code === 'ER_DUP_ENTRY') {
        throw new ConflictException(
          `Ya existe una PQRS con radicado ${dto.radicado}`,
        );
      }

      throw error;
    }
  }

  async findAll(): Promise<Pqrs[]> {
    return this.pqrsRepository.find({
      order: { creadoEn: 'DESC' },
    });
  }

  async findByRadicado(radicado: string): Promise<Pqrs> {
    const pqrs = await this.pqrsRepository.findOne({
      where: { radicado },
    });

    if (!pqrs) {
      throw new NotFoundException(
        `PQRS con radicado ${radicado} no encontrada`,
      );
    }

    return pqrs;
  }

  async findOne(id: string): Promise<Pqrs> {
    const pqrs = await this.pqrsRepository.findOne({ where: { id } });

    if (!pqrs) {
      throw new NotFoundException(`PQRS con id ${id} no encontrada`);
    }

    return pqrs;
  }

  async updateEstado(radicado: string, dto: UpdatePqrsEstadoDto): Promise<Pqrs> {
    const pqrs = await this.findByRadicado(radicado);
    pqrs.estado = dto.estado;
    if (dto.respuesta) pqrs.respuesta = dto.respuesta;
    return this.pqrsRepository.save(pqrs);
  }

  async getFoto(
    pqrsId: string,
    fotoId: string,
  ): Promise<PqrsFoto> {

    const foto = await this.fotoRepo.findOne({
      where: {
        id: fotoId,
        pqrs: {
          id: pqrsId,
        },
      },
      relations: ['pqrs'],
    });

    if (!foto) {
      throw new NotFoundException(
        `Foto ${fotoId} no encontrada para la PQRS ${pqrsId}`,
      );
    }

    return foto;
  }

}