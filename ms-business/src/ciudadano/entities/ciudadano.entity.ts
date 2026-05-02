import { Direccion } from "src/direccion/entities/direccion.entity";
import { Persona } from "src/persona/entities/persona.entity";
import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('ciudadano')
export class Ciudadano extends Persona {
    @PrimaryGeneratedColumn()
    id?: number;

    @OneToOne(() => Persona, (persona) => persona.ciudadano, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'persona_id' })
    persona: Persona;

    @OneToOne(() => Direccion, (direccion) => direccion.ciudadano)
    direccion: Direccion;
}