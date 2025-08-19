import { Injectable, Logger } from '@nestjs/common';
import { AiService } from './ai.service';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface ContractExtractionResult {
  vendorName: string;
  canonicalName?: string;
  businessDescription: string;
  effectiveDate: string;
  renewalDate?: string;
  endDate?: string;
  duration?: string;
  terms: {
    rates: any[];
    caps: any[];
    fees: any[];
    escalationClauses: any[];
    paymentTerms: any;
    billingCycle?: string;
    lateFees?: any;
  };
  clauseSpans?: any[];
  confidence: number;
}

@Injectable()
export class ContractExtractionService {
  private readonly logger = new Logger(ContractExtractionService.name);
  private contractSchema: any;
  private systemPrompt: string;

  constructor(private aiService: AiService) {
    this.loadPromptAndSchema();
  }

  private async loadPromptAndSchema() {
    try {
      const schemaPath = path.join(__dirname, '../../../ops/prompts/openai/contract_extraction_v1.json');
      const promptPath = path.join(__dirname, '../../../ops/prompts/openai/contract_extraction_prompt.txt');
      
      this.contractSchema = JSON.parse(await fs.readFile(schemaPath, 'utf-8').catch(() => this.getDefaultSchema()));
      this.systemPrompt = await fs.readFile(promptPath, 'utf-8').catch(() => this.getDefaultPrompt());
    } catch (error) {
      this.logger.warn('Using default schema and prompt');
      this.contractSchema = this.getDefaultSchema();
      this.systemPrompt = this.getDefaultPrompt();
    }
  }

  async extractContract(text: string): Promise<ContractExtractionResult> {
    const chunks = this.aiService.chunkText(text, 8000, 500);
    
    if (chunks.length === 1) {
      return await this.aiService.extractWithSchema(
        text,
        this.systemPrompt,
        this.contractSchema,
      );
    }

    const results = await Promise.all(
      chunks.map(chunk =>
        this.aiService.extractWithSchema(chunk, this.systemPrompt, this.contractSchema),
      ),
    );

    return this.mergeResults(results);
  }

  private mergeResults(results: ContractExtractionResult[]): ContractExtractionResult {
    const merged: ContractExtractionResult = {
      vendorName: results[0].vendorName,
      businessDescription: results[0].businessDescription,
      effectiveDate: results[0].effectiveDate,
      terms: {
        rates: [],
        caps: [],
        fees: [],
        escalationClauses: [],
        paymentTerms: {},
      },
      confidence: 0,
    };

    for (const result of results) {
      if (result.vendorName && !merged.vendorName) {
        merged.vendorName = result.vendorName;
      }
      if (result.renewalDate) merged.renewalDate = result.renewalDate;
      if (result.endDate) merged.endDate = result.endDate;
      
      merged.terms.rates.push(...(result.terms?.rates || []));
      merged.terms.caps.push(...(result.terms?.caps || []));
      merged.terms.fees.push(...(result.terms?.fees || []));
      merged.terms.escalationClauses.push(...(result.terms?.escalationClauses || []));
      
      if (result.terms?.paymentTerms) {
        merged.terms.paymentTerms = { ...merged.terms.paymentTerms, ...result.terms.paymentTerms };
      }
      
      merged.confidence += result.confidence;
    }

    merged.confidence = merged.confidence / results.length;
    return merged;
  }

  async canonicalizeVendorName(vendorName: string, existingVendors: string[]): Promise<string> {
    if (existingVendors.length === 0) {
      return vendorName.toLowerCase().replace(/[^a-z0-9]/g, '');
    }

    const embeddings = await Promise.all([
      this.aiService.generateEmbedding(vendorName),
      ...existingVendors.map(v => this.aiService.generateEmbedding(v)),
    ]);

    const similarities = existingVendors.map((vendor, i) => ({
      vendor,
      similarity: this.cosineSimilarity(embeddings[0], embeddings[i + 1]),
    }));

    const bestMatch = similarities.sort((a, b) => b.similarity - a.similarity)[0];
    
    if (bestMatch.similarity > 0.85) {
      return bestMatch.vendor;
    }

    return vendorName.toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }

  calculateDates(extraction: ContractExtractionResult): {
    effectiveDate: Date;
    renewalDate?: Date;
    endDate?: Date;
  } {
    const effectiveDate = new Date(extraction.effectiveDate);
    let renewalDate: Date | undefined;
    let endDate: Date | undefined;

    if (extraction.duration) {
      const durationMatch = extraction.duration.match(/(\d+)\s*(year|month|day)/i);
      if (durationMatch) {
        const amount = parseInt(durationMatch[1]);
        const unit = durationMatch[2].toLowerCase();
        
        endDate = new Date(effectiveDate);
        if (unit === 'year') {
          endDate.setFullYear(endDate.getFullYear() + amount);
        } else if (unit === 'month') {
          endDate.setMonth(endDate.getMonth() + amount);
        } else if (unit === 'day') {
          endDate.setDate(endDate.getDate() + amount);
        }
        
        renewalDate = new Date(endDate);
        renewalDate.setDate(renewalDate.getDate() - 30);
      }
    }

    if (extraction.renewalDate) {
      renewalDate = new Date(extraction.renewalDate);
    }
    if (extraction.endDate) {
      endDate = new Date(extraction.endDate);
    }

    return { effectiveDate, renewalDate, endDate };
  }

  private getDefaultSchema(): any {
    return {
      type: 'object',
      properties: {
        vendorName: { type: 'string' },
        businessDescription: { type: 'string' },
        effectiveDate: { type: 'string' },
        renewalDate: { type: 'string' },
        endDate: { type: 'string' },
        duration: { type: 'string' },
        terms: {
          type: 'object',
          properties: {
            rates: { type: 'array' },
            caps: { type: 'array' },
            fees: { type: 'array' },
            escalationClauses: { type: 'array' },
            paymentTerms: { type: 'object' },
            billingCycle: { type: 'string' },
            lateFees: { type: 'object' },
          },
        },
        confidence: { type: 'number' },
      },
      required: ['vendorName', 'effectiveDate', 'terms', 'confidence'],
    };
  }

  private getDefaultPrompt(): string {
    return `Extract contract information and return ONLY valid JSON.
Focus on:
1. Vendor name and business description (1-3 words)
2. Contract dates (effective, renewal, end)
3. All monetary terms, rates, caps, fees
4. Payment terms and billing cycles
5. Escalation clauses and late fees

Return confidence score 0-1 for extraction quality.`;
  }
}