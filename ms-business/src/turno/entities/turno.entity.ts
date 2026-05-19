import { Conductor } from "../../conductor/entities/conductor.entity";
import { Bus } from "../../bus/entities/bus.entity";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('turnos')
export class Turno {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Conductor, (conductor) => conductor.turnos, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'conductor_id' })
  conductor: Conductor | null;

  @ManyToOne(() => Bus, (bus) => bus.turnos, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'bus_id' })
  bus: Bus;

  @Column({ type: 'timestamp', nullable: false })
  fecha_inicio_programada: Date;

  @Column({ type: 'timestamp', nullable: false })
  fecha_fin_programada: Date;

  @Column({ type: 'timestamp', nullable: true })
  fecha_inicio_real: Date;

  @Column({ type: 'timestamp', nullable: true })
  fecha_fin_real: Date;

  @Column({
    type: 'enum',
    enum: ['PROGRAMADO', 'EN_CURSO', 'FINALIZADO'],
    default: 'PROGRAMADO'
  })
  estado: string;

  @Column({ type: 'text', nullable: true })
  observaciones: string;
}