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
};

@WebSocketGateway({
  namespace: '/transport',
  cors: { origin: '*' }
})
export class TransportGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers['authorization'];
      if (!token) throw new Error('Token no proporcionado');

      const payload = this.jwtService.verify(token.replace('Bearer ', ''));
      client.data.user = payload;
      
      const roles = payload.roles || [];
      const sub = payload.sub || payload.id || payload.authId;

      if (roles.includes('Driver')) {
        client.join(`driver:${sub}`);
      }
      client.join(`user:${sub}`);
    } catch (e) {
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    // Limpiar suscripciones si es necesario
  }

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
  handleDriverLocationUpdate(client: Socket, payload: { lat: number, lng: number, busId: string, routeId: string }) {
    const roles = client.data.user?.roles || [];
    if (!roles.includes('Driver') && !roles.includes('Admin')) {
       throw new WsException('Unauthorized');
    }

    if (payload.busId) {
      this.server.to(`bus:${payload.busId}`).emit(WS_EVENTS.BUS_LOCATION_UPDATED, {
        busId: payload.busId, lat: payload.lat, lng: payload.lng, timestamp: new Date().toISOString()
      });
    }

    if (payload.routeId) {
      this.server.to(`route:${payload.routeId}`).emit(WS_EVENTS.ROUTE_BUS_LOCATION_UPDATED, {
        busId: payload.busId, lat: payload.lat, lng: payload.lng, timestamp: new Date().toISOString()
      });
    }
  }
}
