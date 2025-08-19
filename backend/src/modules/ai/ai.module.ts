import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiService } from './ai.service';
import { ContractExtractionService } from './contract-extraction.service';
import { InvoiceParsingService } from './invoice-parsing.service';
import { ReconciliationService } from './reconciliation.service';

@Module({
  imports: [ConfigModule],
  providers: [
    AiService,
    ContractExtractionService,
    InvoiceParsingService,
    ReconciliationService,
  ],
  exports: [
    AiService,
    ContractExtractionService,
    InvoiceParsingService,
    ReconciliationService,
  ],
})
export class AiModule {}