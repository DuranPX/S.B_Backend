// src/websocket/eta-notifier.service.ts
//
// Calcula, de forma heurística, el tiempo estimado de llegada (ETA) de un
// bus a los paraderos de su ruta cuando llega una actualización de GPS, y
// avisa a ms-notifications para que dispare las alertas de "bus a X minutos"
// que los ciudadanos hayan activado.
//
// Heurística (intencionalmente simple, sin requerir mapa de calles):
//   1. Se toman los paraderos de la ruta (RutaParadero, con su lat/lng).
//   2. Se calcula la distancia en línea recta (Haversine) del bus a cada
//      paradero.
//   3. Se estima el ETA en minutos = distancia_km / velocidad_supuesta_kmh * 60.
//      La velocidad supuesta es configurable (BUS_VELOCIDAD_PROMEDIO_KMH,
//      default 20 km/h, razonable para tráfico urbano).
//   4. Solo se notifica para paraderos "cercanos" (umbral en minutos), para
//      no spamear el webhook con cada paradero de la ruta en cada GPS update.
//
// Esto es deliberadamente una aproximación: no usa el grafo de calles ni la
// posición real dentro del recorrido, así que el ETA puede ser optimista en
// rutas con curvas. Si más adelante se integra un proveedor de ruteo (OSRM,
// Google Directions, etc.), este es el único lugar que habría que cambiar.

import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { RutaParaderoService } from '../ruta_paradero/ruta_paradero.service';

const EARTH_RADIUS_KM = 6371;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Distancia en kilómetros entre dos coordenadas (fórmula de Haversine). */
function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

@Injectable()
export class EtaNotifierService {
  private readonly logger = new Logger(EtaNotifierService.name);

  private readonly velocidadPromedioKmh: number;
  private readonly umbralNotificacionMin: number;
  private readonly notificationsUrl: string;
  private readonly apiKey: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly rutaParaderoService: RutaParaderoService,
  ) {
    this.velocidadPromedioKmh = Number(
      process.env.BUS_VELOCIDAD_PROMEDIO_KMH ?? 20,
    );
    // Solo se notifica a ms-notifications si el ETA estimado está dentro de
    // este umbral; evita llamadas innecesarias cuando el bus está lejos de
    // todos los paraderos. 20 min cubre con margen la anticipación máxima
    // que el frontend ofrece (15 min).
    this.umbralNotificacionMin = Number(
      process.env.STOP_ALERT_NOTIFY_THRESHOLD_MIN ?? 20,
    );
    this.notificationsUrl =
      process.env.MS_NOTIFICATIONS_URL ?? 'http://localhost:5002';
    this.apiKey = process.env.N8N_WEBHOOK_API_KEY ?? 'default-dev-api-key';
  }

  /**
   * Punto de entrada: se llama cada vez que llega una actualización de GPS
   * de un bus en una ruta. No lanza excepciones: cualquier fallo (red,
   * ms-notifications caído, ruta sin paraderos, etc.) solo se loguea, para
   * no afectar el tracking en tiempo real del bus.
   */
  async notificarEtaParaderos(params: {
    routeId: string;
    busId: string;
    placa: string;
    lat: number;
    lng: number;
  }): Promise<void> {
    try {
      const paraderos = await this.rutaParaderoService.findByRuta(
        params.routeId,
      );

      if (!paraderos?.length) return;

      for (const rp of paraderos) {
        const paradero = rp.paradero;
        if (!paradero?.latitud || !paradero?.longitud) continue;

        const distanciaKm = haversineKm(
          params.lat,
          params.lng,
          Number(paradero.latitud),
          Number(paradero.longitud),
        );

        const etaMin = (distanciaKm / this.velocidadPromedioKmh) * 60;

        if (etaMin > this.umbralNotificacionMin) continue;

        await this.postStopArrival({
          routeId: params.routeId,
          stopId: paradero.id,
          busId: params.busId,
          placa: params.placa,
          etaMin,
        });
      }
    } catch (err) {
      this.logger.warn(
        `No se pudo calcular/notificar ETA de paraderos: ${(err as Error).message}`,
      );
    }
  }

  private async postStopArrival(payload: {
    routeId: string;
    stopId: string;
    busId: string;
    placa: string;
    etaMin: number;
  }): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.post(
          `${this.notificationsUrl}/api/v1/webhooks/stop-arrival`,
          {
            route_id: payload.routeId,
            stop_id: payload.stopId,
            bus_id: payload.busId,
            placa: payload.placa,
            eta_min: Math.round(payload.etaMin * 10) / 10,
          },
          {
            headers: { 'X-API-Key': this.apiKey },
            timeout: 3000,
          },
        ),
      );
    } catch (err) {
      this.logger.warn(
        `No se pudo notificar ETA a ms-notifications (stop ${payload.stopId}): ${(err as Error).message}`,
      );
    }
  }
}