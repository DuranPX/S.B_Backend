import { Grupo } from "../../grupo/entities/grupo.entity";
import { Persona } from "../../persona/entities/persona.entity";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('grupo_persona')
export class GrupoPersona {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ default: 'miembro' }) // 'miembro' | 'admin'
    rol?: string;

    @Column({ default: () => 'CURRENT_TIMESTAMP' })
    fechaUnion?: Date;

    @ManyToOne(() => Persona, (persona) => persona.grupoPersonas, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'persona_id' })
    persona: Persona;

    @ManyToOne(() => Grupo, (grupo) => grupo.grupoPersonas, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'grupo_id' })
    grupo: Grupo;
}