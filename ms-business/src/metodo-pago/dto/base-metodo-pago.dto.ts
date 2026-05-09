import { IsNotEmpty, IsString } from "class-validator";
import { MetodoPagoTipo } from "../entities/metodo-pago.entity";

export class BaseMetodoPagoDto {
    @IsString()
    @IsNotEmpty({ message: 'El tipo es obligatorio' })
    tipo?: MetodoPagoTipo;

    @IsString()
    @IsNotEmpty({ message: 'La descripción es obligatoria' })
    descripcion?: string;
}