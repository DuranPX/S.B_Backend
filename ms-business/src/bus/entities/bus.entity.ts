import { Empresa } from "../../empresa/entities/empresa.entity";
import { Gps } from "../../gps/entities/gp.entity";
import { IncidenteBus } from "../../incidente-bus/entities/incidente-bus.entity";
import { Programacion } from "../../programacion/entities/programacion.entity";
import { Turno } from "../../turno/entities/turno.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";

export enum EstadoBus {
  OPERATIVO = 'Operativo',
  MANTENIMIENTO = 'Mantenimiento',
  FUERA_SERVICIO = 'Fuera_Servicio',
}

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

    @Column({
        type: 'enum',
        enum: EstadoBus,
        default: EstadoBus.OPERATIVO,
    })
    estado: EstadoBus;

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
