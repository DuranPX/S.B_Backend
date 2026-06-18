import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AsesorService } from './asesor.service';
import { AsesorController } from './asesor.controller';
import { Asesor } from './entities/asesor.entity';
import { Persona } from '../persona/entities/persona.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Asesor,
      Persona, // necesario para que AsesorService pueda inyectar PersonaRepository
    ]),
  ],
  controllers: [AsesorController],
  providers: [AsesorService],
  exports: [AsesorService], // por si ms-notifications lo necesita en el futuro
})
export class AsesorModule {}