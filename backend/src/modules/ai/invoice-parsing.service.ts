import { Injectable, Logger } from '@nestjs/common';
import { AiService } from './ai.service';

export interface InvoiceParseResult {
  vendorName: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  totalAmount: number;
  subtotal: number;
  taxAmount?: number;
  lineItems: {
    description: string;
    quantity: number;
    rate: number;
    unit: string;
    total: number;
  }[];
  fees?: {
    type: 'percent' | 'fixed';
    description: string;
    amount: number;
  }[];
  confidence: number;
}

@Injectable()
export class InvoiceParsingService {
  private readonly logger = new Logger(InvoiceParsingService.name);
  private invoiceSchema: any;
  private systemPrompt: string;

  constructor(private aiService: AiService) {
    this.initializeSchemaAndPrompt();
  }

  private initializeSchemaAndPrompt() {
    this.invoiceSchema = this.getDefaultSchema();
    this.systemPrompt = this.getDefaultPrompt();
  }

  async parseInvoice(text: string): Promise<InvoiceParseResult> {
    try {
      const result = await this.aiService.extractWithSchema(
        text,
        this.systemPrompt,
        this.invoiceSchema,
      );

      return this.normalizeInvoiceData(result);
    } catch (error) {
      this.logger.error('Invoice parsing failed:', error);
      throw error;
    }
  }

  private normalizeInvoiceData(data: any): InvoiceParseResult {
    return {
      vendorName: data.vendorName?.trim(),
      invoiceNumber: data.invoiceNumber?.toString().trim(),
      invoiceDate: this.normalizeDate(data.invoiceDate),
      dueDate: data.dueDate ? this.normalizeDate(data.dueDate) : undefined,
      totalAmount: parseFloat(data.totalAmount || 0),
      subtotal: parseFloat(data.subtotal || 0),
      taxAmount: data.taxAmount ? parseFloat(data.taxAmount) : undefined,
      lineItems: this.normalizeLineItems(data.lineItems || []),
      fees: this.normalizeFees(data.fees || []),
      confidence: data.confidence || 0.8,
    };
  }

  private normalizeLineItems(items: any[]): InvoiceParseResult['lineItems'] {
    return items.map(item => ({
      description: item.description?.trim() || '',
      quantity: parseFloat(item.quantity || 1),
      rate: parseFloat(item.rate || 0),
      unit: item.unit?.trim() || 'each',
      total: parseFloat(item.total || 0),
    }));
  }

  private normalizeFees(fees: any[]): InvoiceParseResult['fees'] {
    return fees.map(fee => ({
      type: fee.type === 'percent' ? 'percent' : 'fixed',
      description: fee.description?.trim() || '',
      amount: parseFloat(fee.amount || 0),
    }));
  }

  private normalizeDate(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      return date.toISOString().split('T')[0];
    } catch {
      return dateStr;
    }
  }

  async matchVendor(
    invoiceVendorName: string,
    existingVendors: { id: string; name: string; canonicalName: string }[],
  ): Promise<string | null> {
    if (existingVendors.length === 0) return null;

    const invoiceEmbedding = await this.aiService.generateEmbedding(invoiceVendorName);
    
    const similarities = await Promise.all(
      existingVendors.map(async vendor => ({
        vendorId: vendor.id,
        similarity: this.cosineSimilarity(
          invoiceEmbedding,
          await this.aiService.generateEmbedding(vendor.name),
        ),
      })),
    );

    const bestMatch = similarities.sort((a, b) => b.similarity - a.similarity)[0];
    
    if (bestMatch.similarity > 0.8) {
      return bestMatch.vendorId;
    }

    return null;
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }

  private getDefaultSchema(): any {
    return {
      type: 'object',
      properties: {
        vendorName: { type: 'string' },
        invoiceNumber: { type: 'string' },
        invoiceDate: { type: 'string' },
        dueDate: { type: 'string' },
        totalAmount: { type: 'number' },
        subtotal: { type: 'number' },
        taxAmount: { type: 'number' },
        lineItems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              description: { type: 'string' },
              quantity: { type: 'number' },
              rate: { type: 'number' },
              unit: { type: 'string' },
              total: { type: 'number' },
            },
            required: ['description', 'total'],
          },
        },
        fees: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['percent', 'fixed'] },
              description: { type: 'string' },
              amount: { type: 'number' },
            },
          },
        },
        confidence: { type: 'number' },
      },
      required: ['vendorName', 'invoiceNumber', 'invoiceDate', 'totalAmount', 'lineItems'],
    };
  }

  private getDefaultPrompt(): string {
    return `Extract invoice information and return ONLY valid JSON.
Parse:
1. Vendor name exactly as shown
2. Invoice number, date, and due date
3. Total amount, subtotal, and tax
4. All line items with description, quantity, rate, unit, total
5. Any additional fees (specify if percentage or fixed amount)

Ensure all monetary values are numbers, not strings.
Return confidence score 0-1 for extraction quality.`;
  }
}