import { MetodoPagoCiudadano } from "src/metodo-pago-ciudadano/entities/metodo-pago-ciudadano.entity";
import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity('metodo_pago')
export class MetodoPago {
    @PrimaryGeneratedColumn('uuid')
    id?: string;

    @Column({enum: ['Tarjeta', 'Efectivo', 'ePayco']})
    tipo?: string;

    @Column()
    descripcion?: string;

    @OneToMany(() => MetodoPagoCiudadano, (metodoPagoCiudadano) => metodoPagoCiudadano.metodoPago)
    metodoPagoCiudadano?: MetodoPagoCiudadano[];
}