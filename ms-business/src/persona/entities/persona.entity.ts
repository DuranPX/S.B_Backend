import { Conductor } from '../../conductor/entities/conductor.entity';
import { DestinatarioPersona } from '../../destinatario-persona/entities/destinatario-persona.entity';
import { GrupoPersona } from '../../grupo-persona/entities/grupo-persona.entity';
import { Mensaje } from '../../mensaje/entities/mensaje.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Ciudadano } from '../../ciudadano/entities/ciudadano.entity';


export enum TipoDocumento {
  CC = 'CC',
  TI = 'TI',
  CE = 'CE',
  PAS = 'PAS',
}

@Entity('personas')
export class Persona {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Referencia lógica al usuario en ms-security.
  // Se inyecta desde el JWT en el controlador - aun no, no esta codificado
  @Column({ name: 'auth_id', unique: true })
  authId: string;

  @Column({ name: 'first_name' })
  firstName: string;

  @Column({ name: 'last_name' })
  lastName: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: false, unique: true })
  email?: string;

  @Column({
    type: 'enum',
    enum: TipoDocumento,
    nullable: false,
  })
  tipoDocumento: TipoDocumento;

  @Column({ nullable: false, unique: true })
  numeroDocumento: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relaciones 
  // El lado inverso de cada relación será completado por el dev de cada módulo.

  @OneToOne(() => Conductor, (conductor) => conductor.persona)
  conductor?: Conductor;

  @OneToOne(() => Ciudadano, (ciudadano) => ciudadano.persona)
  ciudadano?: Ciudadano;

  @OneToMany(() => Mensaje, (m) => m.emisor)
  mensajesEnviados?: Mensaje[];

  @OneToMany(() => DestinatarioPersona, (dp) => dp.persona)
  destinatarios?: DestinatarioPersona[];

  @OneToMany(() => GrupoPersona, (grupoper) => grupoper.persona)
  grupoPersonas?: GrupoPersona[];
}