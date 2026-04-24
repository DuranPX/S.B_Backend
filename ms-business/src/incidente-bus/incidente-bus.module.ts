import { Module } from '@nestjs/common';
import { IncidenteBusService } from './incidente-bus.service';
import { IncidenteBusController } from './incidente-bus.controller';

@Module({
  controllers: [IncidenteBusController],
  providers: [IncidenteBusService],
})
export class IncidenteBusModule {}
