import { IsNotEmpty, IsString } from "class-validator";
import { BaseGpsDto } from "./base-gps.dto";

export class CreateGpsDto extends BaseGpsDto {
    @IsString()
    @IsNotEmpty({ message: 'El bus es obligatorio' })
    busId!: string;
}