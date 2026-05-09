import { DestinatarioGrupo } from "src/destinatario-grupo/entities/destinatario-grupo.entity";
import { GrupoPersona } from "src/grupo-persona/entities/grupo-persona.entity";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity('grupo')
export class Grupo {
    @PrimaryGeneratedColumn('uuid')
    id?: string;

    @Column()
    nombre?: string;

    @Column()
    descripcion?: string;

    @Column()
    fechaCreacion?: Date;

    @OneToMany(() => GrupoPersona, (grupopersona) => grupopersona.grupo)
    grupoPersonas?: GrupoPersona[];

    @OneToMany(() => DestinatarioGrupo, (destinatariogrupo) => destinatariogrupo.grupo)
    destinatarios?: DestinatarioGrupo[];
}