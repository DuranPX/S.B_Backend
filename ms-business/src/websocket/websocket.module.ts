import { Module } from '@nestjs/common';
import { TransportGateway } from './transport.gateway';
import { TransportEventHandlers } from './transport.events';
import { AuthModule } from '../auth/auth.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BusModule } from 'src/bus/bus.module';
import { HttpModule } from '@nestjs/axios';
import { RutaParaderoModule } from '../ruta_paradero/ruta_paradero.module';
import { EtaNotifierService } from './eta-notifier.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Persona } from 'src/persona/entities/persona.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Persona]),
    AuthModule,
    BusModule,
    HttpModule,
    RutaParaderoModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'super-secret',
        signOptions: { expiresIn: '60m' },
      }),
    }),
  ],
  providers: [TransportGateway, TransportEventHandlers, EtaNotifierService],
  exports: [TransportGateway],
})
export class WebsocketModule {}