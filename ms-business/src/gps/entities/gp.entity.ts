import { Bus } from "src/bus/entities/bus.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('gps')
export class Gps {
    @PrimaryGeneratedColumn('uuid')
    id?: string;

    @OneToOne(() => Bus, (bus) => bus.gps, { onDelete: 'CASCADE'})
    @JoinColumn({ name: 'bus_id' })
    bus?: Bus;

    @Column()
    latitud?: number;
    
    @Column()
    longitud?: number;

    @CreateDateColumn()
    createdAt?: Date;
}