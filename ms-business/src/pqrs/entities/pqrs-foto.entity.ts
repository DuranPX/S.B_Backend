import { Pqrs } from './pqrs.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('pqrs_fotos')
export class PqrsFoto {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  nombreOriginal: string;

  @Column({ type: 'text' })
  mimeType: string;

  @Column({ type: 'mediumblob' })
  datos: Buffer;

  @Column({ type: 'int' })
  orden: number;

  @ManyToOne(() => Pqrs, pqrs => pqrs.fotos, { onDelete: 'CASCADE' })
  pqrs: Pqrs;

  @CreateDateColumn()
  createdAt: Date;
}