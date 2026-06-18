import { PqrsFoto } from './pqrs-foto.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum PqrsTipo {
  PETICION = 'Petición',
  QUEJA = 'Queja',
  RECLAMO = 'Reclamo',
  SUGERENCIA = 'Sugerencia',
}

export enum PqrsCategoria {
  CONDUCTOR = 'Conductor',
  BUS = 'Bus',
  RUTA = 'Ruta',
  TARJETA = 'Tarjeta',
  OTRO = 'Otro',
}

export enum PqrsEstado {
  RECIBIDO = 'Recibido',
  EN_REVISION = 'En revisión',
  EN_PROCESO = 'En proceso',
  RESUELTO = 'Resuelto',
}

export enum PqrsDepartamento {
  OPERACIONES = 'operaciones',
  MANTENIMIENTO = 'mantenimiento',
  SISTEMAS = 'sistemas',
  ATENCION_CLIENTE = 'atencion_cliente',
}

@Entity('pqrs')
export class Pqrs {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 30, unique: true, nullable: false })
  radicado: string;

  @Column({ type: 'enum', enum: PqrsTipo, nullable: false })
  tipo: PqrsTipo;

  @Column({ type: 'enum', enum: PqrsCategoria, nullable: false })
  categoria: PqrsCategoria;

  @Column({ type: 'varchar', length: 500, nullable: false })
  descripcion: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  emailContacto: string;

  @Column({
    type: 'enum',
    enum: PqrsEstado,
    default: PqrsEstado.RECIBIDO,
    nullable: false,
  })
  estado: PqrsEstado;

  @Column({
    type: 'enum',
    enum: PqrsDepartamento,
    nullable: false,
  })
  departamento: PqrsDepartamento;

  @Column({ type: 'varchar', length: 50, nullable: false })
  tiempoEstimado: string;

  @Column({ type: 'text', nullable: true })
  respuesta: string | null;

  @CreateDateColumn()
  creadoEn: Date;

  @UpdateDateColumn()
  actualizadoEn: Date;

  @OneToMany(() => PqrsFoto, foto => foto.pqrs, { cascade: true, eager: true })
  fotos: PqrsFoto[];
}