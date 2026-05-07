// src/paradero/entities/paradero.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Nodo } from '../../nodo/entities/nodo.entity';
import { RutaParadero } from '../../ruta_paradero/entities/ruta_paradero.entity';

@Entity('paradero')
export class Paradero {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  codigo: string;

  @Column()
  nombre: string;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  latitud: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  longitud: number;

  @Column({ nullable: true })
  tipo: string;

  @Column({ default: true })
  estado: boolean;

  // Paradero pertenece a un Nodo — si el nodo se elimina, el paradero también
  @ManyToOne(() => Nodo, (nodo) => nodo.paraderos, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'nodo_id' })
  nodo: Nodo;

  // Un paradero aparece en muchas rutas
  @OneToMany(() => RutaParadero, (rutaParadero) => rutaParadero.paradero)
  rutaParaderos: RutaParadero[];
}