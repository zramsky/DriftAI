import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ContractsService } from './contracts.service';
import { ContractsController } from './contracts.controller';
import { ContractProcessor } from './contract.processor';
import { Contract } from '../../entities/contract.entity';
import { Vendor } from '../../entities/vendor.entity';
import { AuditLog } from '../../entities/audit-log.entity';
import { StorageModule } from '../storage/storage.module';
import { AiModule } from '../ai/ai.module';
import { VendorsModule } from '../vendors/vendors.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Contract, Vendor, AuditLog]),
    BullModule.registerQueue({
      name: 'contract-processing',
    }),
    StorageModule,
    AiModule,
    VendorsModule,
  ],
  controllers: [ContractsController],
  providers: [ContractsService, ContractProcessor],
  exports: [ContractsService],
})
export class ContractsModule {}