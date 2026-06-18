import { DestinatarioGrupo } from "../../destinatario-grupo/entities/destinatario-grupo.entity";
import { GrupoPersona } from "../../grupo-persona/entities/grupo-persona.entity";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity('grupo')
export class Grupo {
    @PrimaryGeneratedColumn('uuid')
    id?: string;

    @Column()
    nombre?: string;

    @Column({ nullable: true })
    descripcion?: string;

    @Column({ default: false })
    esPublico?: boolean;

    @Column({ type: 'longtext', nullable: true })
    imagen?: string;

    // authId del creador (viene del JWT de ms-security)
    @Column({ nullable: true })
    creadorAuthId?: string;

    @Column({ type: 'simple-array', nullable: true, default: '' })
    bloqueados?: string[]; // authIds bloqueados

    @Column({ default: () => 'CURRENT_TIMESTAMP' })
    fechaCreacion?: Date;

    @OneToMany(() => GrupoPersona, (grupopersona) => grupopersona.grupo)
    grupoPersonas?: GrupoPersona[];

    @OneToMany(() => DestinatarioGrupo, (destinatariogrupo) => destinatariogrupo.grupo)
    destinatariosGrupo?: DestinatarioGrupo[];

    @Column('simple-json', { nullable: true })
    invitacionesPendientes?: string[];

    @Column('simple-json', { nullable: true })
    logMembresia?: Array<{
        accion: string;
        personaNombre: string;
        realizadoPorNombre: string;
        fecha: string;
    }>;
}