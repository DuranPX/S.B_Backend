import { Empresa } from "src/empresa/entities/empresa.entity";
import { Gps } from "src/gps/entities/gp.entity";
import { IncidenteBus } from "src/incidente-bus/entities/incidente-bus.entity";
import { Programacion } from "src/programacion/entities/programacion.entity";
import { Turno } from "src/turno/entities/turno.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('bus')
export class Bus {
    @PrimaryGeneratedColumn('uuid')
    id?: string;

    @Column({name: 'placa', unique: true})
    placa?: string;

    @Column()
    modelo?: string;

    @Column()
    anio?: number;

    @Column()
    capacidad_total?: number;

    @Column()
    capacidad_sentados?: number;
    
    @Column()
    capacidad_parados?: number;

    @Column({enum: ['Operativo', 'Mantenimiento', 'Fuera_Servicio']})
    estado?: string;

    @ManyToOne(() => Empresa, (empresa) => empresa.bus, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'empresa_id' })
    empresa?: Empresa;

    @Column({ nullable: true })
    foto_url?: string;
    
    @Column({ nullable: true })
    qr_code?: string;

    @OneToOne(() => Gps, (gps) => gps.bus)
    gps?: Gps;
    
    @OneToMany(() => Turno, (t) => t.bus)
    turnos?: Turno[];

    @OneToMany(() => IncidenteBus, (incidenteBus) => incidenteBus.bus)
    incidentes?: IncidenteBus[];

    @OneToMany(() => Programacion, (programacion) => programacion.bus)
    programaciones?: Programacion[];
}
