import { IsUUID, IsNotEmpty } from 'class-validator';

export class RegistrarDescensoDto {
  @IsNotEmpty()
  @IsUUID()
  paraderoDescensoId: string;
}
