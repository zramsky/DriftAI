import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Repository, IsNull, Between } from 'typeorm';
import type { Queue } from 'bull';
import { Invoice, InvoiceStatus } from '../../entities/invoice.entity';
import { ReconciliationReport } from '../../entities/reconciliation-report.entity';
import { AuditLog, AuditAction } from '../../entities/audit-log.entity';
import { StorageService } from '../storage/storage.service';
import { VendorsService } from '../vendors/vendors.service';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(Invoice)
    private invoicesRepository: Repository<Invoice>,
    @InjectRepository(ReconciliationReport)
    private reportsRepository: Repository<ReconciliationReport>,
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
    @InjectQueue('invoice-processing')
    private invoiceQueue: Queue,
    private storageService: StorageService,
    private vendorsService: VendorsService,
  ) {}

  async uploadAndProcess(
    vendorId: string,
    file: Express.Multer.File,
    userId?: string,
  ): Promise<{ invoiceId: string; jobId: string }> {
    const vendor = await this.vendorsService.findOne(vendorId);

    const { key, url } = await this.storageService.uploadFile(
      file.buffer,
      file.originalname,
      file.mimetype,
      'invoices',
    );

    const invoice = this.invoicesRepository.create({
      vendorId,
      fileUrl: url,
      fileName: file.originalname,
      status: InvoiceStatus.PENDING,
      invoiceNumber: `TEMP-${Date.now()}`,
      invoiceDate: new Date(),
      totalAmount: 0,
      subtotal: 0,
      lineItems: [],
    });

    const savedInvoice = await this.invoicesRepository.save(invoice);

    const job = await this.invoiceQueue.add('process-invoice', {
      invoiceId: savedInvoice.id,
      fileKey: key,
      vendorId,
      userId,
    });

    await this.createAuditLog(
      AuditAction.UPLOAD,
      savedInvoice.id,
      userId,
      null,
      { fileName: file.originalname },
    );

    return {
      invoiceId: savedInvoice.id,
      jobId: job.id.toString(),
    };
  }

  async findAll(
    vendorId?: string,
    status?: InvoiceStatus,
    startDate?: Date,
    endDate?: Date,
  ): Promise<Invoice[]> {
    const whereCondition: any = { deletedAt: IsNull() };
    
    if (vendorId) {
      whereCondition.vendorId = vendorId;
    }
    
    if (status) {
      whereCondition.status = status;
    }
    
    if (startDate && endDate) {
      whereCondition.invoiceDate = Between(startDate, endDate);
    }

    return this.invoicesRepository.find({
      where: whereCondition,
      relations: ['vendor'],
      order: { invoiceDate: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Invoice> {
    const invoice = await this.invoicesRepository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['vendor', 'reconciliationReport'],
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    return invoice;
  }

  async getInvoiceStatus(id: string): Promise<{
    status: InvoiceStatus;
    processingState: string;
    lastUpdated: Date;
    jobMetadata?: any;
  }> {
    const invoice = await this.invoicesRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    return {
      status: invoice.status,
      processingState: this.getProcessingState(invoice.status),
      lastUpdated: invoice.updatedAt,
      jobMetadata: invoice.metadata,
    };
  }

  private getProcessingState(status: InvoiceStatus): string {
    switch (status) {
      case InvoiceStatus.PENDING:
        return 'processing';
      case InvoiceStatus.RECONCILED:
        return 'completed';
      case InvoiceStatus.FLAGGED:
        return 'flagged';
      case InvoiceStatus.APPROVED:
        return 'approved';
      case InvoiceStatus.REJECTED:
        return 'rejected';
      default:
        return 'unknown';
    }
  }

  async getReconciliationReport(invoiceId: string): Promise<ReconciliationReport> {
    const report = await this.reportsRepository.findOne({
      where: { invoiceId },
      relations: ['invoice', 'contract'],
    });

    if (!report) {
      throw new NotFoundException(`Reconciliation report for invoice ${invoiceId} not found`);
    }

    return report;
  }

  async updateStatus(
    id: string,
    status: InvoiceStatus,
    userId?: string,
  ): Promise<Invoice> {
    const invoice = await this.findOne(id);
    const oldStatus = invoice.status;

    invoice.status = status;
    const updatedInvoice = await this.invoicesRepository.save(invoice);

    await this.createAuditLog(
      status === InvoiceStatus.APPROVED ? AuditAction.APPROVE : AuditAction.UPDATE,
      invoice.id,
      userId,
      { status: oldStatus },
      { status },
    );

    return updatedInvoice;
  }

  async approveInvoice(id: string, userId?: string): Promise<Invoice> {
    return this.updateStatus(id, InvoiceStatus.APPROVED, userId);
  }

  async rejectInvoice(id: string, reason: string, userId?: string): Promise<Invoice> {
    const invoice = await this.updateStatus(id, InvoiceStatus.REJECTED, userId);
    
    await this.createAuditLog(
      AuditAction.REJECT,
      invoice.id,
      userId,
      null,
      { reason },
    );

    return invoice;
  }

  async getInvoiceStats(vendorId?: string): Promise<{
    total: number;
    pending: number;
    reconciled: number;
    flagged: number;
    approved: number;
    rejected: number;
    totalAmount: number;
    totalDiscrepancies: number;
    totalSavings: number;
  }> {
    const whereCondition: any = { deletedAt: IsNull() };
    if (vendorId) {
      whereCondition.vendorId = vendorId;
    }

    const invoices = await this.invoicesRepository.find({
      where: whereCondition,
      relations: ['reconciliationReport'],
    });

    const stats = {
      total: invoices.length,
      pending: 0,
      reconciled: 0,
      flagged: 0,
      approved: 0,
      rejected: 0,
      totalAmount: 0,
      totalDiscrepancies: 0,
      totalSavings: 0,
    };

    for (const invoice of invoices) {
      stats.totalAmount += Number(invoice.totalAmount);
      
      switch (invoice.status) {
        case InvoiceStatus.PENDING:
          stats.pending++;
          break;
        case InvoiceStatus.RECONCILED:
          stats.reconciled++;
          break;
        case InvoiceStatus.FLAGGED:
          stats.flagged++;
          break;
        case InvoiceStatus.APPROVED:
          stats.approved++;
          break;
        case InvoiceStatus.REJECTED:
          stats.rejected++;
          break;
      }

      if (invoice.reconciliationReport) {
        stats.totalDiscrepancies += Number(invoice.reconciliationReport.totalDiscrepancyAmount);
        stats.totalSavings += Number(invoice.reconciliationReport.totalDiscrepancyAmount);
      }
    }

    return stats;
  }

  async softDelete(id: string, userId?: string): Promise<void> {
    const invoice = await this.findOne(id);
    
    invoice.deletedAt = new Date();
    await this.invoicesRepository.save(invoice);

    await this.createAuditLog(
      AuditAction.DELETE,
      invoice.id,
      userId,
      invoice,
      null,
    );
  }

  private async createAuditLog(
    action: AuditAction,
    entityId: string,
    userId?: string,
    before?: any,
    after?: any,
  ): Promise<void> {
    const auditLog = this.auditLogRepository.create({
      userId,
      action,
      entityType: 'Invoice',
      entityId,
      changes: { before, after },
    });

    await this.auditLogRepository.save(auditLog);
  }
}