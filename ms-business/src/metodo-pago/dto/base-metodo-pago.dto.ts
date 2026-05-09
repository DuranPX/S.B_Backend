import { IsNotEmpty, IsString } from "class-validator";

export class BaseMetodoPagoDto {
    @IsString()
    @IsNotEmpty({ message: 'El tipo es obligatorio' })
    tipo?: string;

    @IsString()
    @IsNotEmpty({ message: 'La descripción es obligatoria' })
    descripcion?: string;
}