import { Process, Processor } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from 'bull';
import { Invoice, InvoiceStatus } from '../../entities/invoice.entity';
import { ReconciliationReport } from '../../entities/reconciliation-report.entity';
import { StorageService } from '../storage/storage.service';
import { PdfExtractionService } from '../storage/pdf-extraction.service';
import { InvoiceParsingService } from '../ai/invoice-parsing.service';
import { ReconciliationService } from '../ai/reconciliation.service';
import { ContractsService } from '../contracts/contracts.service';
import { VendorsService } from '../vendors/vendors.service';

interface InvoiceProcessingJob {
  invoiceId: string;
  fileKey: string;
  vendorId: string;
  userId?: string;
}

@Processor('invoice-processing')
@Injectable()
export class InvoiceProcessor {
  private readonly logger = new Logger(InvoiceProcessor.name);

  constructor(
    @InjectRepository(Invoice)
    private invoicesRepository: Repository<Invoice>,
    @InjectRepository(ReconciliationReport)
    private reportsRepository: Repository<ReconciliationReport>,
    private storageService: StorageService,
    private pdfExtractionService: PdfExtractionService,
    private invoiceParsingService: InvoiceParsingService,
    private reconciliationService: ReconciliationService,
    private contractsService: ContractsService,
    private vendorsService: VendorsService,
  ) {}

  @Process('process-invoice')
  async processInvoice(job: Job<InvoiceProcessingJob>) {
    const { invoiceId, fileKey, vendorId } = job.data;
    this.logger.log(`Processing invoice ${invoiceId}`);

    try {
      const invoice = await this.invoicesRepository.findOne({
        where: { id: invoiceId },
      });

      if (!invoice) {
        throw new Error(`Invoice ${invoiceId} not found`);
      }

      const fileBuffer = await this.storageService.getFile(fileKey);
      
      const extractionResult = await this.pdfExtractionService.extractText(fileBuffer);
      this.logger.log(`Extracted text from PDF using ${extractionResult.method}`);

      const redactedText = this.pdfExtractionService.redactSensitiveData(extractionResult.text);
      
      const invoiceData = await this.invoiceParsingService.parseInvoice(redactedText);
      this.logger.log(`AI parsing completed with confidence: ${invoiceData.confidence}`);

      invoice.invoiceNumber = invoiceData.invoiceNumber;
      invoice.invoiceDate = new Date(invoiceData.invoiceDate);
      invoice.dueDate = invoiceData.dueDate ? new Date(invoiceData.dueDate) : null;
      invoice.totalAmount = invoiceData.totalAmount;
      invoice.subtotal = invoiceData.subtotal;
      invoice.taxAmount = invoiceData.taxAmount;
      invoice.lineItems = invoiceData.lineItems;
      invoice.fees = invoiceData.fees;
      invoice.extractedText = extractionResult.text;
      invoice.metadata = {
        extractionMethod: extractionResult.method,
        confidence: invoiceData.confidence,
        aiModel: 'gpt-4o-mini',
        processingTime: Date.now() - job.timestamp,
      };

      const activeContract = await this.contractsService.findActiveContractForVendor(vendorId);
      
      if (!activeContract) {
        invoice.status = InvoiceStatus.FLAGGED;
        await this.invoicesRepository.save(invoice);
        this.logger.warn(`No active contract found for vendor ${vendorId}`);
        return;
      }

      const reconciliationResult = await this.reconciliationService.reconcileInvoiceWithContract(
        invoice,
        activeContract,
      );
      
      const report = this.reportsRepository.create({
        invoiceId,
        contractId: activeContract.id,
        hasDiscrepancies: reconciliationResult.hasDiscrepancies,
        totalDiscrepancyAmount: reconciliationResult.totalDiscrepancyAmount,
        discrepancies: reconciliationResult.discrepancies,
        checklist: reconciliationResult.checklist,
        rationaleText: reconciliationResult.rationaleText,
        metadata: {
          processingTime: Date.now() - job.timestamp,
          aiModel: 'gpt-4o-mini',
          confidenceScore: invoiceData.confidence,
        },
      });

      await this.reportsRepository.save(report);

      invoice.status = reconciliationResult.hasDiscrepancies
        ? InvoiceStatus.FLAGGED
        : InvoiceStatus.RECONCILED;

      await this.invoicesRepository.save(invoice);

      await this.vendorsService.updateMetrics(vendorId, {
        invoiceCount: 1,
        discrepancyAmount: reconciliationResult.totalDiscrepancyAmount,
        savingsAmount: reconciliationResult.totalDiscrepancyAmount,
      });

      this.logger.log(`Successfully processed invoice ${invoiceId}`);
      return {
        invoiceId,
        status: invoice.status,
        hasDiscrepancies: reconciliationResult.hasDiscrepancies,
        totalDiscrepancyAmount: reconciliationResult.totalDiscrepancyAmount,
      };
    } catch (error) {
      this.logger.error(`Failed to process invoice ${invoiceId}:`, error);
      
      await this.invoicesRepository.update(invoiceId, {
        status: InvoiceStatus.PENDING,
        metadata: {
          error: error.message,
          processingTime: Date.now() - job.timestamp,
        },
      });

      throw error;
    }
  }
}