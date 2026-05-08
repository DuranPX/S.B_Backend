// src/historial/entities/historial.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Ciudadano } from '../../ciudadano/entities/ciudadano.entity';
import { Boleto } from '../../boleto/entities/boleto.entity';

export enum TipoHistorial {
  VIAJE = 'VIAJE',
  RECARGA = 'RECARGA',
  AJUSTE = 'AJUSTE',
}

@Entity('historial')
export class Historial {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Ciudadano, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'ciudadano_id' })
  ciudadano: Ciudadano;

  @Column({ type: 'enum', enum: TipoHistorial })
  tipo: TipoHistorial;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  monto: number;

  @Column({ nullable: true })
  referencia_externa: string;

  // Nullable porque no todo historial viene de un boleto (ej: recargas)
  @ManyToOne(() => Boleto, (boleto) => boleto.historiales, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'boleto_id' })
  boleto: Boleto;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fecha: Date;
}