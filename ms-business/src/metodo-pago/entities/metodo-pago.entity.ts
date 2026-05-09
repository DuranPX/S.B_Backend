import { MetodoPagoCiudadano } from "../../metodo-pago-ciudadano/entities/metodo-pago-ciudadano.entity";
import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

export enum MetodoPagoTipo {
  TARJETA = 'Tarjeta',
  EFECTIVO = 'Efectivo',
  EPAYCO = 'ePayco',
}

@Entity('metodo_pago')
export class MetodoPago {
    @PrimaryGeneratedColumn('uuid')
    id?: string;

    @Column({
        type: 'enum',
        enum: MetodoPagoTipo,
        nullable: false,
    })
    tipo: MetodoPagoTipo;

    @Column()
    descripcion?: string;

    @OneToMany(() => MetodoPagoCiudadano, (metodoPagoCiudadano) => metodoPagoCiudadano.metodoPago)
    metodoPagoCiudadano?: MetodoPagoCiudadano[];
}