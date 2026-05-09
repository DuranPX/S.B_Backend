import { Grupo } from "../../grupo/entities/grupo.entity";
import { Mensaje } from "../../mensaje/entities/mensaje.entity";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('destinatario_grupo')
export class DestinatarioGrupo {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Mensaje, (mensaje) => mensaje.destinatariosGrupo, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'mensaje_id' })
    mensaje: Mensaje;

    @ManyToOne(() => Grupo, (grupo) => grupo.destinatariosGrupo, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'grupo_id' })
    grupo: Grupo;
}
