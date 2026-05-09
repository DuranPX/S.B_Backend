import { Module } from '@nestjs/common';
import { GpsService } from './gps.service';
import { GpsController } from './gps.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Gps } from './entities/gp.entity';
import { BusModule } from 'src/bus/bus.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Gps]),
    BusModule,
  ],
  controllers: [GpsController],
  providers: [GpsService],
  exports: [GpsService],
})
export class GpsModule {}