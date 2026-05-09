import { IsOptional, IsString } from 'class-validator';
import { BaseBusDto } from './base-bus.dto';

export class CreateBusDto extends BaseBusDto {
    @IsOptional()
    @IsString()
    empresaId?: string;
}