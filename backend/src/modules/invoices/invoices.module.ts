import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';
import { InvoiceProcessor } from './invoice.processor';
import { Invoice } from '../../entities/invoice.entity';
import { Contract } from '../../entities/contract.entity';
import { ReconciliationReport } from '../../entities/reconciliation-report.entity';
import { AuditLog } from '../../entities/audit-log.entity';
import { StorageModule } from '../storage/storage.module';
import { AiModule } from '../ai/ai.module';
import { VendorsModule } from '../vendors/vendors.module';
import { ContractsModule } from '../contracts/contracts.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Invoice, Contract, ReconciliationReport, AuditLog]),
    BullModule.registerQueue({
      name: 'invoice-processing',
    }),
    StorageModule,
    AiModule,
    VendorsModule,
    ContractsModule,
  ],
  controllers: [InvoicesController],
  providers: [InvoicesService, InvoiceProcessor],
  exports: [InvoicesService],
})
export class InvoicesModule {}