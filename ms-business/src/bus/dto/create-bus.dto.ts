import { IsOptional, IsNumber } from 'class-validator';
import { BaseBusDto } from './base-bus.dto';

export class CreateBusDto extends BaseBusDto {
    @IsOptional()
    @IsNumber()
    empresaId?: number;
}