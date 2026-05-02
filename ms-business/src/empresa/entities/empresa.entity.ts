import { Bus } from "src/bus/entities/bus.entity";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity('empresa')
export class Empresa {
    @PrimaryGeneratedColumn()
    id?: number;

    @Column()
    nombre?: String;

    @Column({name: 'nit', unique: true})
    nit?: String;

    @OneToMany(() => Bus, (bus) => bus.empresa)
    bus?: Bus;
}