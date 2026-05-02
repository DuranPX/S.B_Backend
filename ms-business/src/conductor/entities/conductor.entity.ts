import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Persona } from '../../persona/entities/persona.entity';
import { Turno } from '../../turno/entities/turno.entity';
import { Empresa } from '../../empresa/entities/empresa.entity';

@Entity('conductores')
export class Conductor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20, unique: true, nullable: false })
  licencia: string;

  @Column({ default: true, nullable: false })
  activo: boolean;

  @OneToOne(() => Persona, (Persona) => Persona.conductor)
  @JoinColumn({ name: 'persona_id' })
  persona: Persona;

  @ManyToMany(() => Empresa, (empresa) => empresa.conductores)
  @JoinTable({ name: 'conductor_empresa' })
  empresas?: Empresa[];

  @OneToMany(() => Turno, (t: Turno) => t.conductor)
  turnos?: Turno[];
}
