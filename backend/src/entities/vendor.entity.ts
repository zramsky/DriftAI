import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Contract } from './contract.entity';
import { Invoice } from './invoice.entity';

@Entity('vendors')
export class Vendor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ name: 'canonical_name', unique: true })
  canonicalName: string;

  @Column({ name: 'business_description', nullable: true })
  businessDescription: string;

  @Column({ default: true })
  active: boolean;

  @Column({ name: 'total_invoices', default: 0 })
  totalInvoices: number;

  @Column({ name: 'total_discrepancies', type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalDiscrepancies: number;

  @Column({ name: 'total_savings', type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalSavings: number;

  @OneToMany(() => Contract, contract => contract.vendor)
  contracts: Contract[];

  @OneToMany(() => Invoice, invoice => invoice.vendor)
  invoices: Invoice[];

  @Column({ name: 'deleted_at', nullable: true })
  deletedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}