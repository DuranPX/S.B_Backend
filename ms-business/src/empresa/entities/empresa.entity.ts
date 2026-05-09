import { Bus } from "../../bus/entities/bus.entity";
import { Conductor } from "../../conductor/entities/conductor.entity";
import { Column, Entity, ManyToMany, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity('empresa')
export class Empresa {
    @PrimaryGeneratedColumn('uuid')
    id?: string;

    @Column()
    nombre?: string;

    @Column({name: 'nit', unique: true})
    nit?: string;

    @OneToMany(() => Bus, (bus) => bus.empresa)
    bus?: Bus[];

    @ManyToMany(() => Conductor, (conductor) => conductor.empresas)
    conductores?: Conductor[];
}