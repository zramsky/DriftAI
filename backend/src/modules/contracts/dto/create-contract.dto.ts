import { IsString, IsDateString, IsEnum, IsOptional, IsObject, IsUUID } from 'class-validator';
import { ContractStatus } from '../../../entities/contract.entity';

export class CreateContractDto {
  @IsUUID()
  vendorId: string;

  @IsDateString()
  effectiveDate: string;

  @IsDateString()
  @IsOptional()
  renewalDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsEnum(ContractStatus)
  @IsOptional()
  status?: ContractStatus;

  @IsObject()
  @IsOptional()
  terms?: any;
}