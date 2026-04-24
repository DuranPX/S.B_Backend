import { Module } from '@nestjs/common';
import { FotoService } from './foto.service';
import { FotoController } from './foto.controller';

@Module({
  controllers: [FotoController],
  providers: [FotoService],
})
export class FotoModule {}
