import { IsString, IsNotEmpty, IsNumber, IsOptional, IsArray, ArrayMinSize, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ParaderoRutaFullDto {
  @IsNotEmpty()
  @IsString()
  paraderoId: string;

  @IsNumber()
  distanciaAnterior: number;

  @IsNumber()
  tiempoEstimadoMins: number;
}

export class NodoRutaFullDto {
  @IsNotEmpty()
  @IsString()
  nodoId: string;
}

export class CrearRutaFullDto {
  @IsNotEmpty()
  @IsString()
  nombre: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsNotEmpty()
  @IsNumber()
  tarifa: number;

  @IsArray()
  @ArrayMinSize(3, { message: 'La ruta debe tener al menos 3 paraderos' })
  @ValidateNested({ each: true })
  @Type(() => ParaderoRutaFullDto)
  paraderos: ParaderoRutaFullDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NodoRutaFullDto)
  nodos?: NodoRutaFullDto[];
}
