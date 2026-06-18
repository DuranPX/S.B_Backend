import { DestinatarioGrupo } from "../../destinatario-grupo/entities/destinatario-grupo.entity";
import { DestinatarioPersona } from "../../destinatario-persona/entities/destinatario-persona.entity";
import { Persona } from "../../persona/entities/persona.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

export enum TipoMensaje {
  PQRS = 'PQRS',
  INCIDENTE = 'Reporte de Incidentes',
  NORMAL = 'Mensaje normal',
}

@Entity('mensaje')
export class Mensaje {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 255, nullable: false })
    contenido: string;

    @Column({ type: 'timestamp', nullable: false })
    fechaEnvio: Date;

    // Ubicación opcional adjunta al mensaje (p.ej. "estoy aquí esperando el bus").
    // Se guardan por separado en vez de un punto geométrico porque no se
    // necesitan consultas espaciales sobre este campo, solo mostrarlo.
    @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
    ubicacionLat?: number;

    @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
    ubicacionLng?: number;

    @Column({
      type: 'enum',
      enum: TipoMensaje,
      default: TipoMensaje.NORMAL,
    })
    tipo: TipoMensaje;

    @ManyToOne(() => Persona, (emisor) => emisor.mensajesEnviados, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'emisor_id' })
    emisor: Persona;

    @OneToMany(() => DestinatarioGrupo, (destinatario) => destinatario.mensaje)
    destinatariosGrupo: DestinatarioGrupo[];

    @OneToMany(() => DestinatarioPersona, (destinatario) => destinatario.mensaje)
    destinatariosPersona: DestinatarioPersona[];

}
