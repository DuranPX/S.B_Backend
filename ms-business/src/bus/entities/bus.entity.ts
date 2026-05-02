import { Empresa } from "src/empresa/entities/empresa.entity";
import { Gps } from "src/gps/entities/gp.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('bus')
export class Bus {
    @PrimaryGeneratedColumn()
    id?: number;

    @Column({name: 'placa', unique: true})
    placa?: String;

    @Column()
    modelo?: String;

    @Column()
    anio?: number;

    @Column()
    capacidad_total?: number;

    @Column()
    capacidad_sentados?: number;
    
    @Column()
    capacidad_parados?: number;

    @Column({enum: ['Operativo', 'Mantenimiento', 'Fuera_Servicio']})
    estado?: String;

    @ManyToOne(() => Empresa, (empresa) => empresa.bus, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'empresa_id' })
    empresa?: Empresa;

    @Column()
    foto_url?: String;
    
    @Column()
    qr_code?: String;

    @OneToOne(() => Gps, (gps) => gps.bus)
    gps?: Gps;
    
    //@OneToMany(() => Turno, (t) => t.bus)
    //turnos: Turno[];
}