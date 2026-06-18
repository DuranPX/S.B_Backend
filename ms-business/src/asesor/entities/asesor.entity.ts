import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Persona } from '../../persona/entities/persona.entity';

@Entity('asesores')
export class Asesor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * El email de Google del asesor.
   * En Google Calendar este email ES el calendarId (calendar primario).
   * El admin lo ingresa al crear el asesor.
   * La cuenta de servicio de n8n debe tener acceso compartido a ese calendar.
   */
  @Column({ type: 'varchar', length: 255, unique: true, nullable: false })
  calendarId: string;

  /**
   * Indica si el asesor está disponible para recibir nuevas citas.
   * true  → aparece en la consulta de disponibilidad de n8n
   * false → se oculta temporalmente (vacaciones, baja, etc.)
   */
  @Column({ default: true, nullable: false })
  disponible: boolean;

  @OneToOne(() => Persona, (persona) => persona.asesor)
  @JoinColumn({ name: 'persona_id' })
  persona: Persona;
}