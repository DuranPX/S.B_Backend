import { MetodoPago } from "src/metodo-pago/entities/metodo-pago.entity";
import { Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('metodo_pago_ciudadano')
export class MetodoPagoCiudadano {
    @PrimaryGeneratedColumn()
    id?: number;

    @OneToOne(() => MetodoPago, (metodoPago) => metodoPago.metodoPagoCiudadano, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'metodo_pago_id' })
    metodoPago: MetodoPago;
}