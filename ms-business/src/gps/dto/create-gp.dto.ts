import { IsNotEmpty, IsNumber } from "class-validator";
import { BaseGpsDto } from "./base-gps.dto";

export class CreateGpsDto extends BaseGpsDto {
    @IsNumber()
    @IsNotEmpty({ message: 'El bus es obligatorio' })
    busId: number;
}