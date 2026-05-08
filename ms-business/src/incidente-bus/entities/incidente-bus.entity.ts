// src/incidente-bus/entities/incidente-bus.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Incidente } from '../../incidente/entities/incidente.entity';
import { Bus } from '../../bus/entities/bus.entity';
import { Foto } from '../../foto/entities/foto.entity';

@Entity('incidente_bus')
export class IncidenteBus {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Incidente, (incidente) => incidente.incidenteBuses, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'incidente_id' })
  incidente: Incidente;

  @ManyToOne(() => Bus, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'bus_id' })
  bus: Bus;

  @OneToMany(() => Foto, (foto) => foto.incidenteBus)
  fotos: Foto[];
}