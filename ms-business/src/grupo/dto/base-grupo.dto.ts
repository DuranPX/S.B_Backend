// base-grupo.dto.ts
import { IsString, IsNotEmpty, IsDateString, IsOptional } from 'class-validator';

export class BaseGrupoDto {
    @IsString()
    @IsNotEmpty({ message: 'El nombre es obligatorio' })
    nombre!: string;

    @IsString()
    @IsNotEmpty({ message: 'La descripción es obligatoria' })
    descripcion!: string;

    @IsOptional()
    @IsDateString()
    fechaCreacion?: Date;
}