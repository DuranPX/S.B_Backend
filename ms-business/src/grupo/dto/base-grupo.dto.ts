import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsDateString, IsArray, ArrayMinSize } from 'class-validator';

export class BaseGrupoDto {
    @IsString()
    @IsNotEmpty({ message: 'El nombre es obligatorio' })
    nombre: string;

    @IsOptional()
    @IsString()
    descripcion?: string;

    @IsOptional()
    @IsBoolean()
    esPublico?: boolean;

    @IsOptional()
    @IsString()
    imagen?: string;

    @IsOptional()
    @IsDateString()
    fechaCreacion?: Date;

    @IsArray()
    @ArrayMinSize(2, { message: 'Debes agregar al menos 2 miembros además de ti' })
    @IsString({ each: true })
    miembrosIds: string[];
}