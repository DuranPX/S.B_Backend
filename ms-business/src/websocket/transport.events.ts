import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { TransportGateway, WS_EVENTS } from './transport.gateway';

@Injectable()
export class TransportEventHandlers {
  constructor(private readonly transportGateway: TransportGateway) {}

  @OnEvent('bus.capacity_updated')
  handleCapacityUpdated(event: { programacionId: string, capacidad: number, routeId: string, busId: string }) {
    if (event.routeId) {
      this.transportGateway.server.to(`route:${event.routeId}`).emit(WS_EVENTS.ROUTE_CAPACITY_UPDATED, {
        routeId: event.routeId,
        busId: event.busId,
        capacity: event.capacidad
      });
    }

    if (event.busId) {
      this.transportGateway.server.to(`bus:${event.busId}`).emit(WS_EVENTS.BUS_CAPACITY_UPDATED, {
        capacity: event.capacidad
      });
    }
  }

  @OnEvent('ticket.validated')
  handleTicketValidated(event: { boletoId: string, authId: string, ciudadanoId: string }) {
    if (event.authId) {
      this.transportGateway.server.to(`user:${event.authId}`).emit(WS_EVENTS.TICKET_VALIDATED, {
        ticketId: event.boletoId, status: 'ACTIVO'
      });
    }
    this.transportGateway.server.emit(WS_EVENTS.PASSENGER_BOARDED, { timestamp: new Date().toISOString() });
  }

  @OnEvent('ticket.descended')
  handleTicketDescended(event: { boletoId: string, authId: string, busId: string }) {
    if (event.authId) {
      this.transportGateway.server.to(`user:${event.authId}`).emit(WS_EVENTS.TRIP_COMPLETED, {
        ticketId: event.boletoId, timestamp: new Date().toISOString()
      });
    }
    
    if (event.busId) {
       this.transportGateway.server.to(`bus:${event.busId}`).emit(WS_EVENTS.PASSENGER_DESCENDED, {
         timestamp: new Date().toISOString()
       });
    }
  }

  @OnEvent('shift.started')
  handleShiftStarted(event: { turnoId: string, conductorId: string, busId: string, horaInicio: Date }) {
    // Notificar al conductor específico
    if (event.conductorId) {
      this.transportGateway.server
        .to(`driver:${event.conductorId}`)
        .emit(WS_EVENTS.SHIFT_STARTED, {
          turnoId: event.turnoId,
          busId: event.busId,
          horaInicio: event.horaInicio,
          mensaje: 'Tu turno ha iniciado exitosamente',
        });
    }
  }
}
