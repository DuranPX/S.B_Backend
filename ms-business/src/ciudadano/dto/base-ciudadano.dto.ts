import { IsNotEmpty, IsString } from "class-validator";

export class BaseCiudadanoDto {
    @IsString()
    @IsNotEmpty({ message: 'El id de la persona es obligatorio' })
    personaId?: string;
}