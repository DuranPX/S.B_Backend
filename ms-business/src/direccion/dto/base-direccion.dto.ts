import { IsNotEmpty, IsString } from "class-validator";

export class BaseDireccionDto {
    @IsString()
    @IsNotEmpty({ message: 'La calle es obligatoria' })
    calle?: string;

    @IsString()
    @IsNotEmpty({ message: 'La ciudad es obligatoria' })
    ciudad?: string;

    @IsString()
    @IsNotEmpty({ message: 'El pais es obligatorio' })
    pais?: string;
}