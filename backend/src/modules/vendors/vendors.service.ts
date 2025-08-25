import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Vendor } from '../../entities/vendor.entity';
import { AuditLog, AuditAction } from '../../entities/audit-log.entity';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';

@Injectable()
export class VendorsService {
  constructor(
    @InjectRepository(Vendor)
    private vendorsRepository: Repository<Vendor>,
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async create(createVendorDto: CreateVendorDto, userId?: string): Promise<Vendor> {
    const existingVendor = await this.vendorsRepository.findOne({
      where: { canonicalName: createVendorDto.canonicalName },
    });

    if (existingVendor) {
      throw new ConflictException('Vendor with this canonical name already exists');
    }

    const vendor = this.vendorsRepository.create(createVendorDto);
    const savedVendor = await this.vendorsRepository.save(vendor);

    await this.createAuditLog(
      AuditAction.CREATE,
      savedVendor.id,
      userId,
      null,
      savedVendor,
    );

    return savedVendor;
  }

  async findAll(includeInactive = false): Promise<Vendor[]> {
    const whereCondition = includeInactive
      ? { deletedAt: IsNull() }
      : { deletedAt: IsNull(), active: true };

    return this.vendorsRepository.find({
      where: whereCondition,
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Vendor> {
    const vendor = await this.vendorsRepository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['contracts', 'invoices'],
    });

    if (!vendor) {
      throw new NotFoundException(`Vendor with ID ${id} not found`);
    }

    return vendor;
  }

  async findByCanonicalName(canonicalName: string): Promise<Vendor | null> {
    return this.vendorsRepository.findOne({
      where: { canonicalName, deletedAt: IsNull() },
    });
  }

  async update(
    id: string,
    updateVendorDto: UpdateVendorDto,
    userId?: string,
  ): Promise<Vendor> {
    const vendor = await this.findOne(id);
    const oldVendor = { ...vendor };

    if (updateVendorDto.canonicalName && updateVendorDto.canonicalName !== vendor.canonicalName) {
      const existing = await this.findByCanonicalName(updateVendorDto.canonicalName);
      if (existing) {
        throw new ConflictException('Another vendor with this canonical name already exists');
      }
    }

    Object.assign(vendor, updateVendorDto);
    const updatedVendor = await this.vendorsRepository.save(vendor);

    await this.createAuditLog(
      AuditAction.UPDATE,
      vendor.id,
      userId,
      oldVendor,
      updatedVendor,
    );

    return updatedVendor;
  }

  async softDelete(id: string, userId?: string): Promise<void> {
    const vendor = await this.findOne(id);
    
    vendor.deletedAt = new Date();
    vendor.active = false;
    await this.vendorsRepository.save(vendor);

    await this.createAuditLog(
      AuditAction.DELETE,
      vendor.id,
      userId,
      vendor,
      null,
    );
  }

  async restore(id: string, userId?: string): Promise<Vendor> {
    const vendor = await this.vendorsRepository.findOne({
      where: { id },
    });

    if (!vendor) {
      throw new NotFoundException(`Vendor with ID ${id} not found`);
    }

    vendor.deletedAt = null as any;
    vendor.active = true;
    const restoredVendor = await this.vendorsRepository.save(vendor);

    await this.createAuditLog(
      AuditAction.UPDATE,
      vendor.id,
      userId,
      { deletedAt: vendor.deletedAt },
      { deletedAt: null },
    );

    return restoredVendor;
  }

  async updateMetrics(
    vendorId: string,
    metrics: {
      invoiceCount?: number;
      discrepancyAmount?: number;
      savingsAmount?: number;
    },
  ): Promise<void> {
    const vendor = await this.findOne(vendorId);

    if (metrics.invoiceCount !== undefined) {
      vendor.totalInvoices += metrics.invoiceCount;
    }

    if (metrics.discrepancyAmount !== undefined) {
      vendor.totalDiscrepancies = Number(vendor.totalDiscrepancies) + metrics.discrepancyAmount;
    }

    if (metrics.savingsAmount !== undefined) {
      vendor.totalSavings = Number(vendor.totalSavings) + metrics.savingsAmount;
    }

    await this.vendorsRepository.save(vendor);
  }

  async getVendorStats(vendorId: string): Promise<{
    totalInvoices: number;
    totalContracts: number;
    totalDiscrepancies: number;
    totalSavings: number;
    averageSavingsPerInvoice: number;
  }> {
    const vendor = await this.vendorsRepository.findOne({
      where: { id: vendorId, deletedAt: IsNull() },
      relations: ['contracts', 'invoices'],
    });

    if (!vendor) {
      throw new NotFoundException(`Vendor with ID ${vendorId} not found`);
    }

    const activeContracts = vendor.contracts.filter(c => c.status === 'active').length;
    const avgSavings = vendor.totalInvoices > 0
      ? Number(vendor.totalSavings) / vendor.totalInvoices
      : 0;

    return {
      totalInvoices: vendor.totalInvoices,
      totalContracts: activeContracts,
      totalDiscrepancies: Number(vendor.totalDiscrepancies),
      totalSavings: Number(vendor.totalSavings),
      averageSavingsPerInvoice: avgSavings,
    };
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
      entityType: 'Vendor',
      entityId,
      changes: { before, after },
    });

    await this.auditLogRepository.save(auditLog);
  }
}