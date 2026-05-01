import { Module } from '@nestjs/common';
import { ProgramacionService } from './programacion.service';
import { ProgramacionController } from './programacion.controller';

@Module({
  controllers: [ProgramacionController],
  providers: [ProgramacionService],
})
export class ProgramacionModule {}
