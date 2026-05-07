// src/ruta-paradero/entities/ruta-paradero.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Ruta } from '../../ruta/entities/ruta.entity';
import { Paradero } from '../../paradero/entities/paradero.entity';

@Entity('ruta_paradero')
export class RutaParadero {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Si se elimina la ruta, se eliminan sus paraderos asociados
  @ManyToOne(() => Ruta, (ruta) => ruta.rutaParaderos, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'ruta_id' })
  ruta: Ruta;

  // Si se elimina el paradero, se elimina su participación en rutas
  @ManyToOne(() => Paradero, (paradero) => paradero.rutaParaderos, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'paradero_id' })
  paradero: Paradero;

  @Column({ type: 'int' })
  orden: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  distancia_desde_anterior: number;

  @Column({ type: 'int', nullable: true })
  tiempo_estimado: number;
}