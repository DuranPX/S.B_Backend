// src/incidente/dto/add-comentario.dto.ts
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AddComentarioDto {
  @IsNotEmpty()
  @IsString()
  texto: string;

  @IsOptional()
  @IsString()
  autor?: string;
}