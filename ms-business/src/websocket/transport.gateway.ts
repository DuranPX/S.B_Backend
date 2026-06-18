import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { BusService } from '../bus/bus.service';
import { OnEvent } from '@nestjs/event-emitter';
import { EtaNotifierService } from './eta-notifier.service';

export const WS_EVENTS = {
  ROUTE_BUS_LOCATION_UPDATED: 'route_bus_location_updated',
  ROUTE_DELAY_UPDATED: 'route_delay_updated',
  ROUTE_CAPACITY_UPDATED: 'route_capacity_updated',
  NEARBY_BUS_UPDATED: 'nearby_bus_updated',
  STOP_CAPACITY_UPDATED: 'stop_capacity_updated',
  STOP_ARRIVAL_ESTIMATION: 'stop_arrival_estimation',
  TICKET_VALIDATED: 'ticket_validated',
  PASSENGER_BOARDED: 'passenger_boarded',
  BUS_CAPACITY_UPDATED: 'bus_capacity_updated',
  PASSENGER_DESCENDED: 'passenger_descended',
  TRIP_COMPLETED: 'trip_completed',
  TRIP_UPDATED: 'trip_updated',
  ACTIVE_TRIP_STATUS: 'active_trip_status',
  SHIFT_STARTED: 'shift_started',
  DRIVER_LOCATION_UPDATED: 'driver_location_updated',
  BUS_LOCATION_UPDATED: 'bus_location_updated',
  PRIVATE_MESSAGE_RECEIVED: 'private_message_received',
  PRIVATE_MESSAGE_READ: 'private_message_read',
};

@WebSocketGateway({
  namespace: '/transport',
  cors: { origin: '*' }
})
export class TransportGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly busService: BusService,
    private readonly etaNotifierService: EtaNotifierService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      console.log(`[WS-Business] Intento de conexión: ${client.id}`);
      
      const disableJwt = process.env.DISABLE_JWT === 'true';
      let payload;

      if (disableJwt) {
        console.log('[WS-Business] 🟡 MODO TEST: Revisión de JWT desactivada');
        payload = { sub: 'test-user', roles: ['Admin', 'Driver'] };
      } else {
        const token = client.handshake.auth.token || client.handshake.headers['authorization'];
        if (!token) throw new Error('Token no proporcionado');
        payload = this.jwtService.verify(token.replace('Bearer ', ''));
      }
      
      client.data.user = payload;
      
      const roles = payload.roles || [];
      const sub = payload.sub || payload.id || payload.authId;

      if (roles.includes('Driver') || roles.includes('Conductor')) {
        client.join(`driver:${sub}`);
      }
      client.join(`user:${sub}`);
      
      console.log(`[WS-Business] 🟢 Conectado cliente: ${client.id}, UserID: ${sub}`);
    } catch (e) {
      console.error(`[WS-Business] 🔴 Error de conexión (${client.id}):`, (e as Error).message);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {}

  @SubscribeMessage('join_route_tracking')
  handleJoinRouteTracking(client: Socket, payload: { routeId: string }) {
    if (!payload?.routeId) throw new WsException('routeId requerido');
    client.join(`route:${payload.routeId}`);
    return { status: 'joined', room: `route:${payload.routeId}` };
  }

  @SubscribeMessage('leave_route_tracking')
  handleLeaveRouteTracking(client: Socket, payload: { routeId: string }) {
    if (!payload?.routeId) throw new WsException('routeId requerido');
    client.leave(`route:${payload.routeId}`);
    return { status: 'left', room: `route:${payload.routeId}` };
  }

  @SubscribeMessage('driver_location_update')
  async handleDriverLocationUpdate(
    client: Socket,
    payload: { lat: number; lng: number; busId: string; routeId: string },
  ) {
    const roles = client.data.user?.roles || [];
    const isDriverOrAdmin =
      roles.includes('Driver') || roles.includes('Conductor') || roles.includes('Admin');
    if (!isDriverOrAdmin) {
      throw new WsException('Unauthorized');
    }

    // Buscar la placa real del bus en la BD
    let placa: string = payload.busId;
    try {
      const bus = await this.busService.findOne(payload.busId);
      placa = bus.placa ?? payload.busId;
    }catch {
      console.warn(`[WS] No se encontró placa para busId: ${payload.busId}`);
    }

    const timestamp = new Date().toISOString();

    if (payload.busId) {
      this.server.to(`bus:${payload.busId}`).emit(WS_EVENTS.BUS_LOCATION_UPDATED, {
        busId: payload.busId, placa, lat: payload.lat, lng: payload.lng, timestamp,
      });
    }

    if (payload.routeId) {
      this.server.to(`route:${payload.routeId}`).emit(WS_EVENTS.ROUTE_BUS_LOCATION_UPDATED, {
        busId: payload.busId, placa, lat: payload.lat, lng: payload.lng, timestamp,
        routeId: payload.routeId,
      });

      // Calcula heurísticamente el ETA del bus hacia los paraderos de la
      // ruta y avisa a ms-notifications para que dispare las alertas de
      // "bus a X minutos" activas. No se espera (await) intencionalmente:
      // no debe retrasar ni romper la actualización de ubicación si
      // ms-notifications está lento o caído (el propio servicio atrapa
      // sus errores internamente).
      void this.etaNotifierService.notificarEtaParaderos({
        routeId: payload.routeId,
        busId: payload.busId,
        placa,
        lat: payload.lat,
        lng: payload.lng,
      });
    }
  }

}