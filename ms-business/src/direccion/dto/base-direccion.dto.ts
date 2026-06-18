import { IsOptional, IsString } from "class-validator";

export class BaseDireccionDto {
    @IsString()
    @IsOptional()
    calle?: string;

    @IsString()
    @IsOptional()
    ciudad?: string;

    @IsString()
    @IsOptional()
    pais?: string;

    @IsString()
    @IsOptional()
    zona?: string;
}