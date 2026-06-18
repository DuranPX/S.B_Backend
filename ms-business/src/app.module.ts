import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PersonaModule } from './persona/persona.module';
import { ConductorModule } from './conductor/conductor.module';
import { CiudadanoModule } from './ciudadano/ciudadano.module';
import { DireccionModule } from './direccion/direccion.module';
import { HistorialModule } from './historial/historial.module';
import { MensajeModule } from './mensaje/mensaje.module';
import { DestinatarioPersonaModule } from './destinatario-persona/destinatario-persona.module';
import { DestinatarioGrupoModule } from './destinatario-grupo/destinatario-grupo.module';
import { GrupoModule } from './grupo/grupo.module';
import { GrupoPersonaModule } from './grupo-persona/grupo-persona.module';
import { BusModule } from './bus/bus.module';
import { RutaModule } from './ruta/ruta.module';
import { ParaderoModule } from './paradero/paradero.module';
import { NodoModule } from './nodo/nodo.module';
import { ProgramacionModule } from './programacion/programacion.module';
import { GpsModule } from './gps/gps.module';
import { EmpresaModule } from './empresa/empresa.module';
import { TurnoModule } from './turno/turno.module';
import { IncidenteModule } from './incidente/incidente.module';
import { IncidenteBusModule } from './incidente-bus/incidente-bus.module';
import { FotoModule } from './foto/foto.module';
import { MetodoPagoModule } from './metodo-pago/metodo-pago.module';
import { MetodoPagoCiudadanoModule } from './metodo-pago-ciudadano/metodo-pago-ciudadano.module';
import { BoletoModule } from './boleto/boleto.module';
import { AuthModule } from './auth/auth.module';
import { WebsocketModule } from './websocket/websocket.module';
import { RutaNodoModule } from './ruta_nodo/ruta_nodo.module';
import { RutaParaderoModule } from './ruta_paradero/ruta_paradero.module';
import { ScheduleModule } from '@nestjs/schedule';
import { AsesorModule } from './asesor/asesor.module';
import { PqrsModule } from './pqrs/pqrs.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USER'),
        password: configService.get<string>('DB_PASS'),
        database: configService.get<string>('DB_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false, // Usaremos migraciones
      }),
    }),
    PersonaModule,
    ConductorModule,
    CiudadanoModule,
    DireccionModule,
    HistorialModule,
    MensajeModule,
    DestinatarioPersonaModule,
    DestinatarioGrupoModule,
    GrupoModule,
    GrupoPersonaModule,
    BusModule,
    RutaModule,
    ParaderoModule,
    NodoModule,
    ProgramacionModule,
    GpsModule,
    EmpresaModule,
    TurnoModule,
    IncidenteModule,
    FotoModule,
    IncidenteBusModule,
    MetodoPagoModule,
    MetodoPagoCiudadanoModule,
    BoletoModule,
    RutaNodoModule,
    RutaParaderoModule,
    RutaNodoModule,
    AuthModule,
    WebsocketModule,
    ScheduleModule.forRoot(),
    AsesorModule,
    PqrsModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
