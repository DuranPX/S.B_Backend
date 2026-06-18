import { BadRequestException, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { CreateAlertaDto, AlcanceAlerta } from './dto/create-alerta.dto';
import { AlertaGateway } from './alerta.gateway';

@Injectable()
export class AlertaService {
    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
        private readonly alertaGateway: AlertaGateway,
    ) { }

    async enviar(dto: CreateAlertaDto, emisorAuthId: string) {
        // Si está programada para el futuro, simplemente confirmamos
        // (en producción iría a una cola, aquí enviamos directo)
        if (dto.programadaPara) {
            const fechaEnvio = new Date(dto.programadaPara);
            if (fechaEnvio <= new Date()) {
                throw new BadRequestException('La fecha programada debe ser futura');
            }
            // Para el proyecto: programar con setTimeout (solo funciona mientras el server esté vivo)
            const delay = fechaEnvio.getTime() - Date.now();
            setTimeout(() => this.emitirAlerta(dto, emisorAuthId), delay);
            return {
                status: 'PROGRAMADA',
                mensaje: `Alerta programada para ${fechaEnvio.toLocaleString('es-CO')}`,
                enviadaPor: emisorAuthId,
            };
        }

        return await this.emitirAlerta(dto, emisorAuthId);
    }

    private async emitirAlerta(dto: CreateAlertaDto, emisorAuthId: string) {
        const notifUrl = this.configService.get<string>('MS_NOTIFICATIONS_URL', 'http://localhost:5002');
        const apiKey = this.configService.get<string>('N8N_WEBHOOK_API_KEY', 'default-dev-api-key');

        const payload = {
            event_type: dto.urgente ? 'alerta_urgente' : 'alerta_masiva',
            titulo: dto.titulo,
            mensaje: dto.mensaje,
            urgente: dto.urgente,
            emisorAuthId,
            timestamp: new Date().toISOString(),
            target: {
                scope: dto.alcance,
                id: dto.targetId || null,
            },
        };

        try {
            await firstValueFrom(
                this.httpService.post(
                    `${notifUrl}/api/v1/webhooks/alerts`,
                    payload,
                    { headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' } }
                )
            );

            this.alertaGateway.emitirAlerta(payload);

            return {
                status: 'ENVIADA',
                mensaje: 'Alerta emitida correctamente',
                alcance: dto.alcance,
                urgente: dto.urgente,
                destinatarios: dto.alcance === AlcanceAlerta.TODOS ? 'Todos los usuarios' : `${dto.alcance}: ${dto.targetId}`,
                timestamp: payload.timestamp,
            };
        } catch (err: any) {
            throw new BadRequestException(
                `Error al contactar ms-notifications: ${err.message}. ¿Está corriendo el servidor de notificaciones?`
            );
        }
    }
}