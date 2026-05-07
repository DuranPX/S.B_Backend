import { IsString, IsNotEmpty, IsNumber, IsEnum, IsOptional, Min } from 'class-validator';

export class BaseBusDto {
    @IsString()
    @IsNotEmpty({ message: 'La placa es obligatoria' })
    placa?: string;

    @IsString()
    @IsNotEmpty({ message: 'El modelo es obligatorio' })
    modelo?: string;

    @IsNumber()
    @Min(1900, { message: 'El año no es válido' })
    anio?: number;

    @IsNumber()
    @Min(1, { message: 'La capacidad total debe ser mayor a 0' })
    capacidad_total?: number;

    @IsNumber()
    @Min(0)
    capacidad_sentados?: number;

    @IsNumber()
    @Min(0)
    capacidad_parados?: number;

    @IsEnum({ enum: ['Operativo', 'Mantenimiento', 'Fuera_Servicio'], message: 'Estado debe ser Operativo, Mantenimiento o Fuera_Servicio' })
    estado?: string;

    @IsOptional()
    @IsString()
    foto_url?: string;

    @IsOptional()
    @IsString()
    qr_code?: string;
}