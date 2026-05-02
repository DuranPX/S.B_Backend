import { Bus } from "src/bus/entities/bus.entity";
import { Conductor } from "src/conductor/entities/conductor.entity";
import { Column, Entity, ManyToMany, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity('empresa')
export class Empresa {
    @PrimaryGeneratedColumn()
    id?: number;

    @Column()
    nombre?: String;

    @Column({name: 'nit', unique: true})
    nit?: String;

    @OneToMany(() => Bus, (bus) => bus.empresa)
    bus?: Bus[];

    @ManyToMany(() => Conductor, (conductor) => conductor.empresas)
    conductores: Conductor[];
}