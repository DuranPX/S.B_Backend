// src/ruta/entities/ruta.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
} from 'typeorm';
import { RutaNodo } from '../../ruta_nodo/entities/ruta_nodo.entity';
import { RutaParadero } from '../../ruta_paradero/entities/ruta_paradero.entity';

@Entity('ruta')
export class Ruta {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  codigo: string;

  @Column()
  nombre: string;

  @Column({ nullable: true })
  descripcion: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  tarifa: number;

  @Column({ type: 'int', nullable: true })
  tiempo_estimado_total: number;

  @Column({ default: true })
  estado: boolean;

  // Una ruta tiene muchos nodos (waypoints), en orden
  @OneToMany(() => RutaNodo, (rutaNodo) => rutaNodo.ruta)
  rutaNodos: RutaNodo[];

  // Una ruta tiene muchos paraderos
  @OneToMany(() => RutaParadero, (rutaParadero) => rutaParadero.ruta)
  rutaParaderos: RutaParadero[];
}