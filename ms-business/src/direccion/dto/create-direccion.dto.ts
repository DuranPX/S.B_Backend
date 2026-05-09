import { IsNotEmpty, IsString } from "class-validator";
import { BaseDireccionDto } from "./base-direccion.dto";

export class CreateDireccionDto extends BaseDireccionDto {
    @IsString()
    @IsNotEmpty({ message: 'El ciudadano es obligatorio' })
    ciudadanoId?: string;
}