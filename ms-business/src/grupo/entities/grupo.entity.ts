import { Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('grupo')
export class Grupo {
    @PrimaryGeneratedColumn('uuid')
    id?: number;
}