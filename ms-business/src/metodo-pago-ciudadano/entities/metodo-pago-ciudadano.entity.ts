import { Ciudadano } from "src/ciudadano/entities/ciudadano.entity";
import { MetodoPago } from "src/metodo-pago/entities/metodo-pago.entity";
import { Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity('metodo_pago_ciudadano')
export class MetodoPagoCiudadano {
    @PrimaryGeneratedColumn()
    id?: number;

    @OneToMany(() => MetodoPago, (metodoPago) => metodoPago.metodoPagoCiudadano, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'metodo_pago_id' })
    metodoPago: MetodoPago;

    @OneToMany(() => Ciudadano, (ciudadano) => ciudadano.metodoPagoCiudadano, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'ciudadano_id' })
    ciudadano: Ciudadano;
}