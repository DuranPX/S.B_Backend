// src/nodo/entities/nodo.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
} from 'typeorm';
import { RutaNodo } from '../../ruta_nodo/entities/ruta_nodo.entity';
import { Paradero } from '../../paradero/entities/paradero.entity';

@Entity('nodo')
export class Nodo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  latitud: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  longitud: number;

  // Un nodo puede estar en muchas rutas (via tabla pivote)
  @OneToMany(() => RutaNodo, (rutaNodo) => rutaNodo.nodo)
  rutaNodos: RutaNodo[];

  // Un nodo puede tener muchos paraderos físicos encima
  @OneToMany(() => Paradero, (paradero) => paradero.nodo)
  paraderos: Paradero[];
}