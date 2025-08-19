import { Process, Processor } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from 'bull';
import { Contract, ContractStatus } from '../../entities/contract.entity';
import { StorageService } from '../storage/storage.service';
import { PdfExtractionService } from '../storage/pdf-extraction.service';
import { ContractExtractionService } from '../ai/contract-extraction.service';
import { VendorsService } from '../vendors/vendors.service';

interface ContractProcessingJob {
  contractId: string;
  fileKey: string;
  vendorId: string;
  userId?: string;
}

@Processor('contract-processing')
@Injectable()
export class ContractProcessor {
  private readonly logger = new Logger(ContractProcessor.name);

  constructor(
    @InjectRepository(Contract)
    private contractsRepository: Repository<Contract>,
    private storageService: StorageService,
    private pdfExtractionService: PdfExtractionService,
    private contractExtractionService: ContractExtractionService,
    private vendorsService: VendorsService,
  ) {}

  @Process('process-contract')
  async processContract(job: Job<ContractProcessingJob>) {
    const { contractId, fileKey, vendorId } = job.data;
    this.logger.log(`Processing contract ${contractId}`);

    try {
      const contract = await this.contractsRepository.findOne({
        where: { id: contractId },
      });

      if (!contract) {
        throw new Error(`Contract ${contractId} not found`);
      }

      const fileBuffer = await this.storageService.getFile(fileKey);
      
      const extractionResult = await this.pdfExtractionService.extractText(fileBuffer);
      this.logger.log(`Extracted text from PDF using ${extractionResult.method}`);

      const redactedText = this.pdfExtractionService.redactSensitiveData(extractionResult.text);
      
      const contractData = await this.contractExtractionService.extractContract(redactedText);
      this.logger.log(`AI extraction completed with confidence: ${contractData.confidence}`);

      if (contractData.confidence < 0.8) {
        contract.status = ContractStatus.NEEDS_REVIEW;
        this.logger.warn(`Low confidence extraction for contract ${contractId}`);
      } else {
        contract.status = ContractStatus.ACTIVE;
      }

      const dates = this.contractExtractionService.calculateDates(contractData);
      
      contract.effectiveDate = dates.effectiveDate;
      contract.renewalDate = dates.renewalDate;
      contract.endDate = dates.endDate;
      contract.terms = contractData.terms;
      contract.extractedText = extractionResult.text;
      contract.metadata = {
        extractionMethod: extractionResult.method,
        confidence: contractData.confidence,
        clauseSpans: contractData.clauseSpans,
        aiModel: 'gpt-4o-mini',
        processingTime: Date.now() - job.timestamp,
      };

      await this.contractsRepository.save(contract);

      const vendor = await this.vendorsService.findOne(vendorId);
      if (contractData.businessDescription && !vendor.businessDescription) {
        await this.vendorsService.update(vendorId, {
          businessDescription: contractData.businessDescription,
        });
      }

      this.logger.log(`Successfully processed contract ${contractId}`);
      return {
        contractId,
        status: contract.status,
        confidence: contractData.confidence,
      };
    } catch (error) {
      this.logger.error(`Failed to process contract ${contractId}:`, error);
      
      await this.contractsRepository.update(contractId, {
        status: ContractStatus.NEEDS_REVIEW,
        metadata: {
          error: error.message,
          processingTime: Date.now() - job.timestamp,
        },
      });

      throw error;
    }
  }
}