import { IsString, IsNotEmpty } from 'class-validator';

export class BaseEmpresaDto {
    @IsString()
    @IsNotEmpty({ message: 'El nombre es obligatorio' })
    nombre?: string;

    @IsString()
    @IsNotEmpty({ message: 'El NIT es obligatorio' })
    nit?: string;
}