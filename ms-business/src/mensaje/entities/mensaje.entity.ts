import { DestinatarioGrupo } from "src/destinatario-grupo/entities/destinatario-grupo.entity";
import { DestinatarioPersona } from "src/destinatario-persona/entities/destinatario-persona.entity";
import { Persona } from "src/persona/entities/persona.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity('mensaje')
export class Mensaje {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 255, nullable: false })
    contenido: string;

    @Column({ type: 'timestamp', nullable: false })
    fechaEnvio: Date;

    @Column({ type: 'varchar', length: 50, nullable: true, enum: ['PQRS', 'Reporte de Incidentes', 'Mensaje normal'] })
    tipo: string;

    @ManyToOne(() => Persona, (emisor) => emisor.mensajesEnviados, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'emisor_id' })
    emisor: Persona;

    @OneToMany(() => DestinatarioGrupo, (destinatario) => destinatario.mensaje)
    destinatariosGrupo: DestinatarioGrupo[];

    @OneToMany(() => DestinatarioPersona, (destinatario) => destinatario.mensaje)
    destinatariosPersona: DestinatarioPersona[];

}
