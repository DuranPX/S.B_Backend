import { Module } from '@nestjs/common';
import { ParaderoService } from './paradero.service';
import { ParaderoController } from './paradero.controller';

@Module({
  controllers: [ParaderoController],
  providers: [ParaderoService],
})
export class ParaderoModule {}
