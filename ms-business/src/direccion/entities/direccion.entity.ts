import { Ciudadano } from "src/ciudadano/entities/ciudadano.entity";
import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('direccion')
export class Direccion {
    @PrimaryGeneratedColumn()
    id?: number;

    @OneToOne(() => Ciudadano, (ciudadano) => ciudadano.direccion, {onDelete: 'CASCADE',})
    @JoinColumn({ name: 'ciudadano_id' })
    ciudadano: Ciudadano;

    @Column()
    calle?: String;

    @Column()
    ciudad?: String;

    @Column()
    pais?: String;
}