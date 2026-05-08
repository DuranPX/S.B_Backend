// src/programacion/entities/programacion.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Ruta } from '../../ruta/entities/ruta.entity';
import { Bus } from '../../bus/entities/bus.entity';
import { Boleto } from '../../boleto/entities/boleto.entity';

export enum TipoRecurrencia {
  DIARIA = 'Diaria',
  LABORAL = 'Laboral',
  FIN_SEMANA = 'Fin_Semana',
}

export enum EstadoProgramacion {
  PROGRAMADO = 'Programado',
  EN_CURSO = 'En_Curso',
  FINALIZADO = 'Finalizado',
}

@Entity('programacion')
export class Programacion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Ruta, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'ruta_id' })
  ruta: Ruta;

  @ManyToOne(() => Bus, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'bus_id' })
  bus: Bus;

  @Column({ type: 'date' })
  fecha: Date;

  @Column({ type: 'time' })
  hora_salida: string;

  @Column({ type: 'int', default: 0 })
  tolerancia_minutos: number;

  @Column({ type: 'int', default: 0 })
  pasajeros_actuales: number;

  @Column({ type: 'enum', enum: TipoRecurrencia })
  tipo_recurrencia: TipoRecurrencia;

  @Column({ type: 'enum', enum: EstadoProgramacion, default: EstadoProgramacion.PROGRAMADO })
  estado: EstadoProgramacion;

  @OneToMany(() => Boleto, (boleto) => boleto.programacion)
  boletos: Boleto[];
}