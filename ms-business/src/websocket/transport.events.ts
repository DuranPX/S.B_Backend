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
        ticketId: event.boletoId,
        status: 'ACTIVO',
        message: 'Abordaje exitoso',
        timestamp: new Date().toISOString(),
      });
    }
    this.transportGateway.server.emit(WS_EVENTS.PASSENGER_BOARDED, { timestamp: new Date().toISOString() });
  }

  @OnEvent('ticket.descended')
  handleTicketDescended(event: { boletoId: string, authId: string, busId: string }) {
    if (event.authId) {
      this.transportGateway.server.to(`user:${event.authId}`).emit(WS_EVENTS.TRIP_COMPLETED, {
        ticketId: event.boletoId,
        timestamp: new Date().toISOString(),
        message: 'Viaje completado - Gracias por usar nuestro servicio',
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

  @OnEvent('shift.ended')
  handleShiftEnded(event: { turnoId: string, conductorId: string, busId: string, horaFin: Date }) {
      if (event.conductorId) {
          this.transportGateway.server
              .to(`driver:${event.conductorId}`)
              .emit(WS_EVENTS.SHIFT_STARTED, {
                  turnoId: event.turnoId,
                  busId: event.busId,
                  horaFin: event.horaFin,
                  mensaje: 'Tu turno ha finalizado.',
              });
      }
  }

    @OnEvent('message.received')
  handlePrivateMessage(event: {
    authId: string;
    mensajeId: string;
    contenido: string;
    fechaEnvio: Date;
    emisorId: string;
  }) {
    this.transportGateway.server
      .to(`user:${event.authId}`)
      .emit(
        WS_EVENTS.PRIVATE_MESSAGE_RECEIVED,
        event,
      );
    console.log('🔥 EVENTO MENSAJE RECIBIDO', event);
  }

  @OnEvent('message.read')
  handleMessageRead(event: {
    authId: string;
    mensajeId: string;
    fechaLectura: Date;
  }) {
    this.transportGateway.server
      .to(`user:${event.authId}`)
      .emit(
        WS_EVENTS.PRIVATE_MESSAGE_READ,
        event,
      );
    console.log('🔥 EVENTO MENSAJE LEIDO', event);
  }
}