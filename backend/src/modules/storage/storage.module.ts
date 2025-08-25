import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StorageService } from './storage.service';
import { StorageController } from './storage.controller';
import { PdfExtractionService } from './pdf-extraction.service';

@Module({
  imports: [ConfigModule],
  controllers: [StorageController],
  providers: [StorageService, PdfExtractionService],
  exports: [StorageService, PdfExtractionService],
})
export class StorageModule {}