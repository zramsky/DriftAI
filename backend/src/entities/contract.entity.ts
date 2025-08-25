import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Vendor } from './vendor.entity';

export enum ContractStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  NEEDS_REVIEW = 'needs_review',
  EXPIRED = 'expired'
}

@Entity('contracts')
export class Contract {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'vendor_id' })
  vendorId: string;

  @ManyToOne(() => Vendor, vendor => vendor.contracts)
  @JoinColumn({ name: 'vendor_id' })
  vendor: Vendor;

  @Column({ name: 'file_url' })
  fileUrl: string;

  @Column({ name: 'file_name' })
  fileName: string;

  @Column({ name: 'effective_date', type: 'date' })
  effectiveDate: Date;

  @Column({ name: 'renewal_date', type: 'date', nullable: true })
  renewalDate: Date;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate: Date;

  @Column({
    type: 'enum',
    enum: ContractStatus,
    default: ContractStatus.ACTIVE
  })
  status: ContractStatus;

  @Column({ type: 'jsonb', nullable: true })
  terms: {
    rates?: any[];
    caps?: any[];
    fees?: any[];
    escalationClauses?: any[];
    paymentTerms?: any;
    billingCycle?: string;
    lateFees?: any;
  };

  @Column({ name: 'extracted_text', type: 'text', nullable: true })
  extractedText: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    extractionMethod?: string;
    confidence?: number;
    clauseSpans?: any[];
    aiModel?: string;
    processingTime?: number;
    error?: string;
  };

  @Column({ name: 'deleted_at', nullable: true })
  deletedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}