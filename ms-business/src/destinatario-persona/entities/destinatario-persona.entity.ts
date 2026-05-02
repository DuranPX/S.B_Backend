import { Mensaje } from "src/mensaje/entities/mensaje.entity";
import { Persona } from "src/persona/entities/persona.entity";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('destinatario_persona')
export class DestinatarioPersona {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'boolean', default: false })
    leido: boolean;

    @ManyToOne(() => Mensaje, (mensaje) => mensaje.destinatariosPersona, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'mensaje_id' })
    mensaje: Mensaje;

    @ManyToOne(() => Persona, (persona) => persona.destinatarios, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'persona_id' })
    persona: Persona;
}
