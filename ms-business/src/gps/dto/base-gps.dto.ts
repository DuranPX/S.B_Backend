import { IsNotEmpty, IsNumber } from "class-validator";

export class BaseGpsDto {
    @IsNumber()
    @IsNotEmpty({ message: 'La latitud es obligatoria' })
    latitud?: number;
    
    @IsNumber()
    @IsNotEmpty({ message: 'La longitud es obligatoria' })
    longitud?: number;
}