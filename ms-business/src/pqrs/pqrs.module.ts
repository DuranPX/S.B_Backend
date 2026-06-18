import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PqrsService } from './pqrs.service';
import { PqrsController } from './pqrs.controller';
import { Pqrs } from './entities/pqrs.entity';
import { PqrsFoto } from './entities/pqrs-foto.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Pqrs, PqrsFoto])],
  controllers: [PqrsController],
  providers: [PqrsService],
  exports: [PqrsService],
})
export class PqrsModule { }