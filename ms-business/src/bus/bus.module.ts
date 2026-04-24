import { Module } from '@nestjs/common';
import { BusService } from './bus.service';
import { BusController } from './bus.controller';

@Module({
  controllers: [BusController],
  providers: [BusService],
})
export class BusModule {}
