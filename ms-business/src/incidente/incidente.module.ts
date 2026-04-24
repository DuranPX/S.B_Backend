import { Module } from '@nestjs/common';
import { IncidenteService } from './incidente.service';
import { IncidenteController } from './incidente.controller';

@Module({
  controllers: [IncidenteController],
  providers: [IncidenteService],
})
export class IncidenteModule {}
