import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateDestinatarioGrupoDto } from './dto/create-destinatario-grupo.dto';
import { UpdateDestinatarioGrupoDto } from './dto/update-destinatario-grupo.dto';
import { DestinatarioGrupo } from './entities/destinatario-grupo.entity';
import { Mensaje } from '../mensaje/entities/mensaje.entity';
import { Grupo } from '../grupo/entities/grupo.entity';

@Injectable()
export class DestinatarioGrupoService {
  constructor(
    @InjectRepository(DestinatarioGrupo)
    private readonly destinatarioGrupoRepository: Repository<DestinatarioGrupo>,
    @InjectRepository(Mensaje)
    private readonly mensajeRepository: Repository<Mensaje>,
    @InjectRepository(Grupo)
    private readonly grupoRepository: Repository<Grupo>,
  ) {}

  async create(createDestinatarioGrupoDto: CreateDestinatarioGrupoDto) {
    const { mensajeId, grupoId } = createDestinatarioGrupoDto;

    const mensaje = await this.mensajeRepository.findOne({ where: { id: mensajeId } });
    if (!mensaje) throw new NotFoundException(`Mensaje with ID ${mensajeId} not found`);

    const grupo = await this.grupoRepository.findOne({ where: { id: grupoId } });
    if (!grupo) throw new NotFoundException(`Grupo with ID ${grupoId} not found`);

    const exists = await this.destinatarioGrupoRepository.findOne({
      where: { mensaje: { id: mensajeId }, grupo: { id: grupoId } }
    });
    if (exists) throw new ConflictException(`DestinatarioGrupo combination already exists`);

    const destinatarioGrupo = this.destinatarioGrupoRepository.create({
      mensaje,
      grupo,
    });
    return await this.destinatarioGrupoRepository.save(destinatarioGrupo);
  }

  async findAll() {
    return await this.destinatarioGrupoRepository.find({
      relations: ['mensaje', 'grupo'],
    });
  }

  async findOne(id: string) {
    const destinatarioGrupo = await this.destinatarioGrupoRepository.findOne({
      where: { id },
      relations: ['mensaje', 'grupo'],
    });
    if (!destinatarioGrupo) {
      throw new NotFoundException(`DestinatarioGrupo with ID ${id} not found`);
    }
    return destinatarioGrupo;
  }

  async update(id: string, updateDestinatarioGrupoDto: UpdateDestinatarioGrupoDto) {
    const destinatarioGrupo = await this.findOne(id);
    const { mensajeId, grupoId } = updateDestinatarioGrupoDto;
    
    if (mensajeId) {
      const mensaje = await this.mensajeRepository.findOne({ where: { id: mensajeId } });
      if (!mensaje) throw new NotFoundException(`Mensaje with ID ${mensajeId} not found`);
      destinatarioGrupo.mensaje = mensaje;
    }
    
    if (grupoId) {
      const grupo = await this.grupoRepository.findOne({ where: { id: grupoId } });
      if (!grupo) throw new NotFoundException(`Grupo with ID ${grupoId} not found`);
      destinatarioGrupo.grupo = grupo;
    }

    if (mensajeId || grupoId) {
      const exists = await this.destinatarioGrupoRepository.findOne({
        where: { 
          mensaje: { id: destinatarioGrupo.mensaje.id }, 
          grupo: { id: (destinatarioGrupo.grupo as any).id } 
        }
      });
      if (exists && exists.id !== id) {
        throw new ConflictException(`DestinatarioGrupo combination already exists`);
      }
    }

    return await this.destinatarioGrupoRepository.save(destinatarioGrupo);
  }

  async remove(id: string) {
    const destinatarioGrupo = await this.findOne(id);
    return await this.destinatarioGrupoRepository.remove(destinatarioGrupo);
  }
}
