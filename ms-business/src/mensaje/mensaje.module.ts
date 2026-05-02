import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MensajeService } from './mensaje.service';
import { MensajeController } from './mensaje.controller';
import { Mensaje } from './entities/mensaje.entity';
import { Persona } from '../persona/entities/persona.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Mensaje, Persona])],
  controllers: [MensajeController],
  providers: [MensajeService],
  exports: [MensajeService],
})
export class MensajeModule {}
