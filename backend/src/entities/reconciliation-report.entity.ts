import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn, ManyToOne } from 'typeorm';
import { Invoice } from './invoice.entity';
import { Contract } from './contract.entity';

export enum DiscrepancyPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum DiscrepancyType {
  RATE_OVERAGE = 'rate_overage',
  MISSING_CAP = 'missing_cap',
  UNAUTHORIZED_FEE = 'unauthorized_fee',
  INCORRECT_QUANTITY = 'incorrect_quantity',
  DATE_MISMATCH = 'date_mismatch',
  TAX_ERROR = 'tax_error',
  OTHER = 'other'
}

@Entity('reconciliation_reports')
export class ReconciliationReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'invoice_id', unique: true })
  invoiceId: string;

  @OneToOne(() => Invoice, invoice => invoice.reconciliationReport)
  @JoinColumn({ name: 'invoice_id' })
  invoice: Invoice;

  @Column({ name: 'contract_id' })
  contractId: string;

  @ManyToOne(() => Contract)
  @JoinColumn({ name: 'contract_id' })
  contract: Contract;

  @Column({ name: 'has_discrepancies', default: false })
  hasDiscrepancies: boolean;

  @Column({ name: 'total_discrepancy_amount', type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalDiscrepancyAmount: number;

  @Column({ type: 'jsonb' })
  discrepancies: {
    type: DiscrepancyType;
    priority: DiscrepancyPriority;
    description: string;
    expectedValue: any;
    actualValue: any;
    amount: number;
    lineItemIndex?: number;
  }[];

  @Column({ type: 'jsonb' })
  checklist: {
    item: string;
    passed: boolean;
    details: string;
    confidence: number;
  }[];

  @Column({ name: 'rationale_text', type: 'text' })
  rationaleText: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    processingTime?: number;
    aiModel?: string;
    confidenceScore?: number;
  };

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}