import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

import { AlertaService } from './alerta.service';
import { AlertaController } from './alerta.controller';
import { AlertaGateway } from './alerta.gateway';


@Module({
  imports: [
    HttpModule,
  ],

  controllers: [
    AlertaController
  ],

  providers: [
    AlertaService,
    AlertaGateway
  ]

})
export class AlertaModule {}