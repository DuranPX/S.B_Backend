import { PartialType } from '@nestjs/mapped-types';
import { CreateMetodoPagoCiudadanoDto } from './create-metodo-pago-ciudadano.dto';

export class UpdateMetodoPagoCiudadanoDto extends PartialType(CreateMetodoPagoCiudadanoDto) {}