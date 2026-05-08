// src/boleto/entities/boleto.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Ciudadano } from '../../ciudadano/entities/ciudadano.entity';
import { Programacion } from '../../programacion/entities/programacion.entity';
import { MetodoPago } from '../../metodo-pago/entities/metodo-pago.entity';
import { Paradero } from '../../paradero/entities/paradero.entity';
import { Historial } from '../../historial/entities/historial.entity';

export enum EstadoBoleto {
  ACTIVO = 'Activo',
  COMPLETADO = 'Completado',
  CANCELADO = 'Cancelado',
}

@Entity('boleto')
export class Boleto {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Ciudadano, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'ciudadano_id' })
  ciudadano: Ciudadano;

  @ManyToOne(() => Programacion, (programacion) => programacion.boletos, {
    onDelete: 'RESTRICT',
    nullable: false,
  })
  @JoinColumn({ name: 'programacion_id' })
  programacion: Programacion;

  @ManyToOne(() => MetodoPago, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'metodo_pago_id' })
  metodoPago: MetodoPago;

  @ManyToOne(() => Paradero, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'paradero_abordaje_id' })
  paraderoAbordaje: Paradero;

  @ManyToOne(() => Paradero, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'paradero_descenso_id' })
  paraderoDescenso: Paradero;

  @Column({ type: 'timestamp', nullable: true })
  hora_abordaje: Date;

  @Column({ type: 'timestamp', nullable: true })
  hora_descenso: Date;

  @Column({ type: 'enum', enum: EstadoBoleto, default: EstadoBoleto.ACTIVO })
  estado: EstadoBoleto;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  monto_pagado: number;

  @Column({ nullable: true })
  qr_validacion: string;

  @OneToMany(() => Historial, (historial) => historial.boleto)
  historiales: Historial[];
}