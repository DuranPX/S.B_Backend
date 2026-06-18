import { Boleto } from "../../boleto/entities/boleto.entity";
import { Direccion } from "../../direccion/entities/direccion.entity";
import { MetodoPagoCiudadano } from "../../metodo-pago-ciudadano/entities/metodo-pago-ciudadano.entity";
import { Persona } from "../../persona/entities/persona.entity";
import { Column, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('ciudadano')
export class Ciudadano {
    @PrimaryGeneratedColumn('uuid')
    id?: string;

    @Column({ default: false, nullable: false })
    alertaClimaActiva: boolean;

    @Column({ type: 'varchar', length: 5, nullable: true })
    horarioViaje: string | null;

    @OneToOne(() => Persona, (persona) => persona.ciudadano, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'persona_id' })
    persona?: Persona;

    @OneToOne(() => Direccion, (direccion) => direccion.ciudadano)
    direccion?: Direccion;

    @OneToMany(() => MetodoPagoCiudadano, (metodoPagoCiudadano) => metodoPagoCiudadano.ciudadano)
    metodoPagoCiudadano?: MetodoPagoCiudadano[];

    @OneToMany(() => Boleto, (boleto) => boleto.ciudadano)
    boletos?: Boleto[];
}