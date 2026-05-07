// src/ruta-nodo/entities/ruta-nodo.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Ruta } from '../../ruta/entities/ruta.entity';
import { Nodo } from '../../nodo/entities/nodo.entity';

@Entity('ruta_nodo')
export class RutaNodo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Si se elimina la ruta, se eliminan sus nodos asociados
  @ManyToOne(() => Ruta, (ruta) => ruta.rutaNodos, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'ruta_id' })
  ruta: Ruta;

  // Si se elimina el nodo, se elimina su participación en rutas
  @ManyToOne(() => Nodo, (nodo) => nodo.rutaNodos, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'nodo_id' })
  nodo: Nodo;

  @Column({ type: 'int' })
  orden: number;
}