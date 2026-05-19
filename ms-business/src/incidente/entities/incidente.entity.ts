// src/incidente/entities/incidente.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
} from 'typeorm';
import { IncidenteBus } from '../../incidente-bus/entities/incidente-bus.entity';

export enum TipoIncidente {
  MECANICO = 'Mecánico',
  ACCIDENTE = 'Accidente',
  RETRASO = 'Retraso',
  OTRO = 'Otro',
}

export enum GravedadIncidente {
  BAJO = 'Bajo',
  MEDIO = 'Medio',
  ALTO = 'Alto',
  CRITICO = 'Crítico',
}

export enum EstadoIncidente {
  PENDIENTE = 'Pendiente',
  EN_REVISION = 'En_Revision',
  RESUELTO = 'Resuelto',
}

export interface Comentario {
  texto: string;
  fecha: string;
  autor?: string;
}

@Entity('incidente')
export class Incidente {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: TipoIncidente })
  tipo: TipoIncidente;

  @Column({ type: 'enum', enum: GravedadIncidente })
  gravedad: GravedadIncidente;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ type: 'text', nullable: true })
  seguimiento_log: string;

  @Column({ type: 'enum', enum: EstadoIncidente, default: EstadoIncidente.PENDIENTE })
  estado: EstadoIncidente;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  latitud: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  longitud: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fecha_reporte: Date;

  @Column({
    type: 'json',
    nullable: true,
  })
  comentarios: Comentario[];

  @OneToMany(() => IncidenteBus, (incidenteBus) => incidenteBus.incidente)
  incidenteBuses: IncidenteBus[];
}
