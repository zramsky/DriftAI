import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Repository, IsNull } from 'typeorm';
import type { Queue } from 'bull';
import { Contract, ContractStatus } from '../../entities/contract.entity';
import { Vendor } from '../../entities/vendor.entity';
import { AuditLog, AuditAction } from '../../entities/audit-log.entity';
import { StorageService } from '../storage/storage.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';

@Injectable()
export class ContractsService {
  constructor(
    @InjectRepository(Contract)
    private contractsRepository: Repository<Contract>,
    @InjectRepository(Vendor)
    private vendorsRepository: Repository<Vendor>,
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
    @InjectQueue('contract-processing')
    private contractQueue: Queue,
    private storageService: StorageService,
  ) {}

  async uploadAndProcess(
    vendorId: string,
    file: Express.Multer.File,
    userId?: string,
  ): Promise<{ contractId: string; jobId: string }> {
    const vendor = await this.vendorsRepository.findOne({
      where: { id: vendorId, deletedAt: IsNull() },
    });

    if (!vendor) {
      throw new NotFoundException(`Vendor with ID ${vendorId} not found`);
    }

    const { key, url } = await this.storageService.uploadFile(
      file.buffer,
      file.originalname,
      file.mimetype,
      'contracts',
    );

    const contract = this.contractsRepository.create({
      vendorId,
      fileUrl: url,
      fileName: file.originalname,
      status: ContractStatus.NEEDS_REVIEW,
      effectiveDate: new Date(),
    });

    const savedContract = await this.contractsRepository.save(contract);

    const job = await this.contractQueue.add('process-contract', {
      contractId: savedContract.id,
      fileKey: key,
      vendorId,
      userId,
    });

    await this.createAuditLog(
      AuditAction.UPLOAD,
      savedContract.id,
      userId,
      null,
      { fileName: file.originalname },
    );

    return {
      contractId: savedContract.id,
      jobId: job.id.toString(),
    };
  }

  async findAll(vendorId?: string, status?: ContractStatus): Promise<Contract[]> {
    const whereCondition: any = { deletedAt: IsNull() };
    
    if (vendorId) {
      whereCondition.vendorId = vendorId;
    }
    
    if (status) {
      whereCondition.status = status;
    }

    return this.contractsRepository.find({
      where: whereCondition,
      relations: ['vendor'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Contract> {
    const contract = await this.contractsRepository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['vendor'],
    });

    if (!contract) {
      throw new NotFoundException(`Contract with ID ${id} not found`);
    }

    return contract;
  }

  async findActiveContractForVendor(vendorId: string): Promise<Contract | null> {
    return this.contractsRepository.findOne({
      where: {
        vendorId,
        status: ContractStatus.ACTIVE,
        deletedAt: IsNull(),
      },
      order: { effectiveDate: 'DESC' },
    });
  }

  async update(
    id: string,
    updateContractDto: UpdateContractDto,
    userId?: string,
  ): Promise<Contract> {
    const contract = await this.findOne(id);
    const oldContract = { ...contract };

    Object.assign(contract, updateContractDto);
    const updatedContract = await this.contractsRepository.save(contract);

    await this.createAuditLog(
      AuditAction.UPDATE,
      contract.id,
      userId,
      oldContract,
      updatedContract,
    );

    return updatedContract;
  }

  async updateStatus(
    id: string,
    status: ContractStatus,
    userId?: string,
  ): Promise<Contract> {
    const contract = await this.findOne(id);
    const oldStatus = contract.status;

    if (status === ContractStatus.ACTIVE) {
      const existingActive = await this.findActiveContractForVendor(contract.vendorId);
      if (existingActive && existingActive.id !== id) {
        existingActive.status = ContractStatus.INACTIVE;
        await this.contractsRepository.save(existingActive);
      }
    }

    contract.status = status;
    const updatedContract = await this.contractsRepository.save(contract);

    await this.createAuditLog(
      AuditAction.UPDATE,
      contract.id,
      userId,
      { status: oldStatus },
      { status },
    );

    return updatedContract;
  }

  async softDelete(id: string, userId?: string): Promise<void> {
    const contract = await this.findOne(id);
    
    contract.deletedAt = new Date();
    contract.status = ContractStatus.INACTIVE;
    await this.contractsRepository.save(contract);

    await this.createAuditLog(
      AuditAction.DELETE,
      contract.id,
      userId,
      contract,
      null,
    );
  }

  async checkExpiredContracts(): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiredContracts = await this.contractsRepository.find({
      where: {
        status: ContractStatus.ACTIVE,
        deletedAt: IsNull(),
      },
    });

    for (const contract of expiredContracts) {
      if (contract.endDate && new Date(contract.endDate) < today) {
        contract.status = ContractStatus.EXPIRED;
        await this.contractsRepository.save(contract);
      }
    }
  }

  async getContractTerms(contractId: string): Promise<any> {
    const contract = await this.findOne(contractId);
    return contract.terms || {};
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
      entityType: 'Contract',
      entityId,
      changes: { before, after },
    });

    await this.auditLogRepository.save(auditLog);
  }
}