import { IsString, IsNotEmpty, IsBoolean, IsOptional, IsEnum, IsDateString } from 'class-validator';

export enum AlcanceAlerta {
    TODOS = 'all',
    RUTA = 'route',
    ZONA = 'zone',
}

export class CreateAlertaDto {
    @IsString()
    @IsNotEmpty({ message: 'El título es obligatorio' })
    titulo: string;

    @IsString()
    @IsNotEmpty({ message: 'El mensaje es obligatorio' })
    mensaje: string;

    @IsEnum(AlcanceAlerta, { message: 'Alcance debe ser all, route o zone' })
    alcance: AlcanceAlerta;

    @IsOptional()
    @IsString()
    targetId?: string; // rutaId o zonaId si aplica

    @IsBoolean()
    urgente: boolean;

    @IsOptional()
    @IsDateString()
    programadaPara?: string; // si viene, programar envío; si no, enviar ahora
}