import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { TransportGateway, WS_EVENTS } from './transport.gateway';

@Injectable()
export class TransportEventHandlers {
  constructor(private readonly transportGateway: TransportGateway) { }

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

  // ── Grupos ──
  @OnEvent('grupo.miembro_agregado')
  handleMiembroAgregado(event: { grupoId: string, nombreGrupo: string, authId: string, mensaje: string }) {
    console.log('[WS] handleMiembroAgregado', event);
    console.log(
      '[WS] Enviando grupo_notificacion a',
      `user:${event.authId}`
    );
    this.transportGateway.server
      .to(`user:${event.authId}`)
      .emit('grupo_notificacion', {
        tipo: 'AGREGADO',
        grupoId: event.grupoId,
        nombreGrupo: event.nombreGrupo,
        mensaje: event.mensaje,
      });
  }

  @OnEvent('grupo.miembro_removido')
  handleMiembroRemovido(event: { grupoId: string, nombreGrupo: string, authId: string, mensaje: string }) {
    this.transportGateway.server
      .to(`user:${event.authId}`)
      .emit('grupo_notificacion', {
        tipo: 'REMOVIDO',
        grupoId: event.grupoId,
        nombreGrupo: event.nombreGrupo,
        mensaje: event.mensaje,
      });
  }

  @OnEvent('grupo.miembro_unido')
  handleMiembroUnido(event: { grupoId: string, nombreGrupo: string, nombrePersona: string, creadorAuthId: string }) {
    if (event.creadorAuthId) {
      console.log('[WS] handleMiembroUnido', event);
      this.transportGateway.server
        .to(`user:${event.creadorAuthId}`)
        .emit('grupo_notificacion', {
          tipo: 'NUEVO_MIEMBRO',
          grupoId: event.grupoId,
          nombreGrupo: event.nombreGrupo,
          mensaje: `${event.nombrePersona} se unió al grupo "${event.nombreGrupo}"`,
        });
    }
  }

  @OnEvent('grupo.miembro_salio')
  handleMiembroSalio(event: { grupoId: string, nombreGrupo: string, nombrePersona: string, creadorAuthId: string }) {
    if (event.creadorAuthId) {
      this.transportGateway.server
        .to(`user:${event.creadorAuthId}`)
        .emit('grupo_notificacion', {
          tipo: 'MIEMBRO_SALIO',
          grupoId: event.grupoId,
          nombreGrupo: event.nombreGrupo,
          mensaje: `${event.nombrePersona} abandonó el grupo "${event.nombreGrupo}"`,
        });
    }
  }

  @OnEvent('grupo.usuario_bloqueado')
  handleUsuarioBloqueado(event: {
    authId: string;
    grupoId: string;
    nombreGrupo: string;
  }) {

    this.transportGateway.server
      .to(`user:${event.authId}`)
      .emit('grupo_notificacion', {
        tipo: 'BLOQUEADO',
        grupoId: event.grupoId,
        nombreGrupo: event.nombreGrupo,
        mensaje: `Fuiste bloqueado del grupo "${event.nombreGrupo}"`,
      });
  }

  // ── Mensajes ──
  @OnEvent('mensaje.nuevo')
  handleMensajeNuevo(event: { authId: string, mensajeId: string, emisorNombre: string, preview: string }) {
    this.transportGateway.server
      .to(`user:${event.authId}`)
      .emit('mensaje_nuevo', {
        mensajeId: event.mensajeId,
        emisorNombre: event.emisorNombre,
        preview: event.preview,
        timestamp: new Date().toISOString(),
      });
  }

  @OnEvent('mensaje.grupo')
  handleMensajeGrupo(event: { grupoId: string, nombreGrupo: string, mensajeId: string, emisorNombre: string, preview: string, miembros: string[] }) {
    for (const authId of event.miembros) {
      this.transportGateway.server
        .to(`user:${authId}`)
        .emit('mensaje_grupo_nuevo', {
          grupoId: event.grupoId,
          nombreGrupo: event.nombreGrupo,
          mensajeId: event.mensajeId,
          emisorNombre: event.emisorNombre,
          preview: event.preview,
          timestamp: new Date().toISOString(),
        });
    }
  }

  @OnEvent('grupo.invitacion')
  handleInvitacionGrupo(event: {
    authId: string;
    grupoId: string;
    nombreGrupo: string;
  }) {
    this.transportGateway.server
      .to(`user:${event.authId}`)
      .emit('grupo_notificacion', {
        tipo: 'INVITACION',
        grupoId: event.grupoId,
        nombreGrupo: event.nombreGrupo,
        mensaje: `Has sido invitado al grupo "${event.nombreGrupo}"`,
      });
    console.log('Grupo notificación invitación: ', event);
  }

  @OnEvent('grupo.miembro_unido_bienvenida')
  handleBienvenidaGrupo(event: {
    authId: string;
    grupoId: string;
    nombreGrupo: string;
    mensaje: string;
  }) {
    console.log('[WS] handleBienvenidaGrupo', event);
    this.transportGateway.server
      .to(`user:${event.authId}`)
      .emit('grupo_notificacion', {
        tipo: 'BIENVENIDA',
        grupoId: event.grupoId,
        nombreGrupo: event.nombreGrupo,
        mensaje: event.mensaje,
      });
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