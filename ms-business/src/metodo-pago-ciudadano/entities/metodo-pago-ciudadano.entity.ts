import { Boleto } from "../../boleto/entities/boleto.entity";
import { Ciudadano } from "../../ciudadano/entities/ciudadano.entity";
import { MetodoPago } from "../../metodo-pago/entities/metodo-pago.entity";
import { Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity('metodo_pago_ciudadano')
export class MetodoPagoCiudadano {
    @PrimaryGeneratedColumn('uuid')
    id?: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    saldo?: number;

    @ManyToOne(() => MetodoPago, (metodoPago) => metodoPago.metodoPagoCiudadano, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'metodo_pago_id' })
    metodoPago?: MetodoPago;

    @ManyToOne(() => Ciudadano, (ciudadano) => ciudadano.metodoPagoCiudadano, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'ciudadano_id' })
    ciudadano?: Ciudadano;

    @OneToMany(() => Boleto, (boleto) => boleto.metodoPagoCiudadano)
    boletos?: Boleto[];
}