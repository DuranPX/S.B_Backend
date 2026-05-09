import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusService } from './bus.service';
import { BusController } from './bus.controller';
import { Bus } from './entities/bus.entity';
import { EmpresaModule } from '../empresa/empresa.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Bus]),
        EmpresaModule,
    ],
    controllers: [BusController],
    providers: [BusService],
    exports: [BusService],
})
export class BusModule { }