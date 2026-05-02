import { Direccion } from "src/direccion/entities/direccion.entity";
import { MetodoPagoCiudadano } from "src/metodo-pago-ciudadano/entities/metodo-pago-ciudadano.entity";
import { MetodoPago } from "src/metodo-pago/entities/metodo-pago.entity";
import { Persona } from "src/persona/entities/persona.entity";
import { Column, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('ciudadano')
export class Ciudadano {
    @PrimaryGeneratedColumn()
    id?: number;

    @OneToOne(() => Persona, (persona) => persona.ciudadano, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'persona_id' })
    persona: Persona;

    @OneToOne(() => Direccion, (direccion) => direccion.ciudadano)
    direccion: Direccion;

    @OneToMany(() => MetodoPagoCiudadano, (metodoPagoCiudadano) => metodoPagoCiudadano.ciudadano)
    metodoPagoCiudadano?: MetodoPagoCiudadano[];
}