import { IsString, IsNotEmpty } from 'class-validator';

export class BaseMetodoPagoCiudadanoDto {
    @IsString()
    @IsNotEmpty({ message: 'El ciudadano es obligatorio' })
    ciudadanoId!: string;

    @IsString()
    @IsNotEmpty({ message: 'El método de pago es obligatorio' })
    metodoPagoId!: string;
}