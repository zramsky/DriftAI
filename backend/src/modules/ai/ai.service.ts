import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import Ajv from 'ajv';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private openai: OpenAI | null = null;
  private ajv: Ajv;
  private isEnabled: boolean;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get('OPENAI_API_KEY');
    this.isEnabled = !!apiKey;
    
    if (this.isEnabled) {
      this.openai = new OpenAI({
        apiKey,
        organization: this.configService.get('OPENAI_ORG_ID'),
      });
      this.logger.log('OpenAI service initialized');
    } else {
      this.logger.warn('OpenAI service disabled - no API key provided');
    }
    
    this.ajv = new Ajv();
  }

  async extractWithSchema(
    text: string,
    systemPrompt: string,
    schema: any,
    model: string = 'gpt-4o-mini',
  ): Promise<any> {
    if (!this.isEnabled || !this.openai) {
      this.logger.warn('OpenAI service not available, returning mock data');
      return this.getMockExtractionData(schema);
    }

    try {
      const completion = await this.openai.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text },
        ],
        response_format: { type: 'json_object' },
        temperature: 0,
        max_tokens: 4096,
      });

      const content = completion.choices[0].message.content ?? '{}';
      const result = JSON.parse(content);
      
      const validate = this.ajv.compile(schema);
      const valid = validate(result);
      
      if (!valid) {
        this.logger.error('Schema validation failed:', validate.errors);
        throw new Error('Schema validation failed');
      }

      return result;
    } catch (error) {
      this.logger.error('AI extraction failed:', error);
      throw error;
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.isEnabled || !this.openai) {
      this.logger.warn('OpenAI service not available, returning mock embedding');
      return new Array(1536).fill(0).map(() => Math.random() * 2 - 1);
    }

    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
      });
      return response.data[0].embedding;
    } catch (error) {
      this.logger.error('Embedding generation failed:', error);
      throw error;
    }
  }

  async explainInPlainEnglish(
    data: any,
    context: string,
    model: string = 'gpt-4o-mini',
  ): Promise<string> {
    if (!this.isEnabled || !this.openai) {
      this.logger.warn('OpenAI service not available, returning generic explanation');
      return `Analysis for ${context}: The system has processed the provided data and identified key patterns. AI-powered analysis is currently unavailable, but the core functionality remains operational.`;
    }

    try {
      const completion = await this.openai.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are a professional business analyst. Explain the following data in clear, concise business terms.',
          },
          {
            role: 'user',
            content: `Context: ${context}\n\nData: ${JSON.stringify(data, null, 2)}\n\nProvide a brief, professional explanation.`,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      });

      return completion.choices[0].message.content ?? '';
    } catch (error) {
      this.logger.error('Plain English generation failed:', error);
      throw error;
    }
  }

  chunkText(text: string, maxTokens: number = 8000, overlap: number = 500): string[] {
    const words = text.split(/\s+/);
    const wordsPerChunk = Math.floor(maxTokens / 1.3);
    const chunks: string[] = [];
    
    for (let i = 0; i < words.length; i += wordsPerChunk - overlap) {
      const chunk = words.slice(i, i + wordsPerChunk).join(' ');
      chunks.push(chunk);
    }
    
    return chunks;
  }

  private getMockExtractionData(schema: any): any {
    // Return basic mock data structure based on common extraction patterns
    if (schema?.properties?.contractTerms) {
      return {
        contractTerms: {
          effectiveDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          paymentTerms: 'Net 30',
          renewalTerms: 'Annual',
        },
        vendor: {
          name: 'Unknown Vendor',
          address: 'Address not extracted',
        },
        amount: 0,
        status: 'needs_review',
      };
    }

    if (schema?.properties?.invoiceData) {
      return {
        invoiceData: {
          invoiceNumber: 'INV-MOCK-001',
          invoiceDate: new Date().toISOString().split('T')[0],
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          totalAmount: 100.00,
          subtotal: 100.00,
          taxAmount: 0,
          lineItems: [
            {
              description: 'Service or product (AI extraction unavailable)',
              quantity: 1,
              rate: 100.00,
              unit: 'each',
              total: 100.00,
            },
          ],
        },
      };
    }

    // Default fallback
    return {
      status: 'needs_review',
      extracted: false,
      reason: 'AI extraction service unavailable',
    };
  }

  isAiEnabled(): boolean {
    return this.isEnabled;
  }
}