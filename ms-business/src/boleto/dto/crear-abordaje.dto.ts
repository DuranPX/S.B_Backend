import { IsUUID, IsNotEmpty } from 'class-validator';

export class CrearAbordajeDto {
  @IsNotEmpty()
  @IsUUID()
  programacionId: string;

  @IsNotEmpty()
  @IsUUID()
  metodoPagoId: string;

  @IsNotEmpty()
  @IsUUID()
  paraderoId: string;
}
