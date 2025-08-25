import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { Vendor } from './vendor.entity';
import { ReconciliationReport } from './reconciliation-report.entity';

export enum InvoiceStatus {
  PENDING = 'pending',
  RECONCILED = 'reconciled',
  FLAGGED = 'flagged',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'vendor_id' })
  vendorId: string;

  @ManyToOne(() => Vendor, vendor => vendor.invoices)
  @JoinColumn({ name: 'vendor_id' })
  vendor: Vendor;

  @Column({ name: 'invoice_number', unique: true })
  invoiceNumber: string;

  @Column({ name: 'invoice_date', type: 'date' })
  invoiceDate: Date;

  @Column({ name: 'due_date', type: 'date', nullable: true })
  dueDate: Date;

  @Column({ name: 'file_url' })
  fileUrl: string;

  @Column({ name: 'file_name' })
  fileName: string;

  @Column({
    type: 'enum',
    enum: InvoiceStatus,
    default: InvoiceStatus.PENDING
  })
  status: InvoiceStatus;

  @Column({ name: 'total_amount', type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ name: 'subtotal', type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @Column({ name: 'tax_amount', type: 'decimal', precision: 10, scale: 2, nullable: true })
  taxAmount: number;

  @Column({ type: 'jsonb' })
  lineItems: {
    description: string;
    quantity: number;
    rate: number;
    unit: string;
    total: number;
  }[];

  @Column({ type: 'jsonb', nullable: true })
  fees: {
    type: 'percent' | 'fixed';
    description: string;
    amount: number;
  }[];

  @Column({ name: 'extracted_text', type: 'text', nullable: true })
  extractedText: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    extractionMethod?: string;
    confidence?: number;
    aiModel?: string;
    processingTime?: number;
    error?: string;
  };

  @OneToOne(() => ReconciliationReport, report => report.invoice)
  reconciliationReport: ReconciliationReport;

  @Column({ name: 'deleted_at', nullable: true })
  deletedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}