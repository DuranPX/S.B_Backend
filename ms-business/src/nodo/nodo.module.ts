import { Module } from '@nestjs/common';
import { NodoService } from './nodo.service';
import { NodoController } from './nodo.controller';

@Module({
  controllers: [NodoController],
  providers: [NodoService],
})
export class NodoModule {}
