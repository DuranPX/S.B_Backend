// src/foto/entities/foto.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { IncidenteBus } from '../../incidente-bus/entities/incidente-bus.entity';

@Entity('foto')
export class Foto {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  url: string;

  @ManyToOne(() => IncidenteBus, (incidenteBus) => incidenteBus.fotos, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'incidente_bus_id' })
  incidenteBus: IncidenteBus;
}