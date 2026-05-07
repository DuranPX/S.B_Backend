import { IsNotEmpty, IsNumber } from "class-validator";
import { BaseDireccionDto } from "./base-direccion.dto";

export class CreateDireccionDto extends BaseDireccionDto {
    @IsNumber()
    @IsNotEmpty({ message: 'El ciudadano es obligatorio' })
    ciudadanoId?: number;
}