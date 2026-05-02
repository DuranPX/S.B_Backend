import { DestinatarioGrupo } from "src/destinatario-grupo/entities/destinatario-grupo.entity";
import { Grupo } from "src/grupo/entities/grupo.entity";
import { Persona } from "src/persona/entities/persona.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity('grupo_persona')
export class GrupoPersona {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Persona, (persona) => persona.grupoPersonas, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'persona_id' })
    persona: Persona;

    @ManyToOne(() => Grupo, (grupo) => grupo.grupoPersonas, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'grupo_id' })
    grupo: Grupo;
}
