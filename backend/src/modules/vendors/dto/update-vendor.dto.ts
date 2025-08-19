import { PartialType } from '@nestjs/mapped-types';
import { CreateVendorDto } from './create-vendor.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateVendorDto extends PartialType(CreateVendorDto) {
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}