import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AlertaService } from './alerta.service';
import { CreateAlertaDto } from './dto/create-alerta.dto';
import { AlertaGateway } from './alerta.gateway';

@Controller('alerta')
export class AlertaController {
    constructor(
        private readonly alertaService: AlertaService,
        private readonly alertaGateway: AlertaGateway
    ) { }

    @UseGuards(JwtAuthGuard)
    @Post()
    enviar(@Body() dto: CreateAlertaDto, @Request() req) {
        const authId = req.user.authId || req.user.sub;
        return this.alertaService.enviar(dto, authId);
    }

    @Post('notificacion')
    recibirNotificacion(
        @Body() data: any
    ) {

        this.alertaGateway
            .emitirAlerta(data);    


        return {
            status: 'ok'
        };

    }
}