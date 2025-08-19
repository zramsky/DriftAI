import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TextractClient, AnalyzeDocumentCommand } from '@aws-sdk/client-textract';
import * as pdfParse from 'pdf-parse';
import * as crypto from 'crypto';

export enum ExtractionMethod {
  PDF_PARSE = 'pdf-parse',
  TEXTRACT = 'textract',
}

export interface ExtractionResult {
  text: string;
  method: ExtractionMethod;
  pages: number;
  metadata?: any;
  confidence?: number;
}

@Injectable()
export class PdfExtractionService {
  private readonly logger = new Logger(PdfExtractionService.name);
  private textractClient: TextractClient;
  private readonly maxFileSize = 10 * 1024 * 1024; // 10MB

  constructor(private configService: ConfigService) {
    this.textractClient = new TextractClient({
      region: this.configService.get('AWS_REGION'),
      credentials: {
        accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
      },
    });
  }

  async extractText(fileBuffer: Buffer): Promise<ExtractionResult> {
    if (fileBuffer.length > this.maxFileSize) {
      throw new Error(`File size exceeds maximum limit of ${this.maxFileSize} bytes`);
    }

    try {
      const result = await this.extractWithPdfParse(fileBuffer);
      
      if (this.isTextQualitySufficient(result.text)) {
        return result;
      }
      
      this.logger.warn('PDF text extraction quality insufficient, falling back to Textract');
      return await this.extractWithTextract(fileBuffer);
    } catch (error) {
      this.logger.error('Primary extraction failed, attempting Textract:', error);
      return await this.extractWithTextract(fileBuffer);
    }
  }

  private async extractWithPdfParse(fileBuffer: Buffer): Promise<ExtractionResult> {
    try {
      const data = await pdfParse(fileBuffer);
      
      const cleanedText = this.cleanExtractedText(data.text);
      
      return {
        text: cleanedText,
        method: ExtractionMethod.PDF_PARSE,
        pages: data.numpages,
        metadata: {
          info: data.info,
          version: data.version,
        },
        confidence: this.calculateTextConfidence(cleanedText),
      };
    } catch (error) {
      this.logger.error('PDF parse extraction failed:', error);
      throw error;
    }
  }

  private async extractWithTextract(fileBuffer: Buffer): Promise<ExtractionResult> {
    try {
      const command = new AnalyzeDocumentCommand({
        Document: {
          Bytes: fileBuffer,
        },
        FeatureTypes: ['TABLES', 'FORMS'],
      });

      const response = await this.textractClient.send(command);
      
      const extractedText = this.processTextractResponse(response);
      
      return {
        text: extractedText,
        method: ExtractionMethod.TEXTRACT,
        pages: response.DocumentMetadata?.Pages || 1,
        metadata: {
          documentMetadata: response.DocumentMetadata,
          blocksCount: response.Blocks?.length,
        },
        confidence: this.calculateTextractConfidence(response),
      };
    } catch (error) {
      this.logger.error('Textract extraction failed:', error);
      throw new Error('Document extraction failed with all methods');
    }
  }

  private processTextractResponse(response: any): string {
    const blocks = response.Blocks || [];
    const lines: string[] = [];
    
    for (const block of blocks) {
      if (block.BlockType === 'LINE' && block.Text) {
        lines.push(block.Text);
      } else if (block.BlockType === 'TABLE') {
        lines.push(this.extractTableText(block, blocks));
      }
    }
    
    return this.cleanExtractedText(lines.join('\n'));
  }

  private extractTableText(tableBlock: any, allBlocks: any[]): string {
    const cells = tableBlock.Relationships?.find((r: any) => r.Type === 'CHILD')?.Ids || [];
    const cellTexts: string[] = [];
    
    for (const cellId of cells) {
      const cellBlock = allBlocks.find(b => b.Id === cellId);
      if (cellBlock?.Text) {
        cellTexts.push(cellBlock.Text);
      }
    }
    
    return cellTexts.join(' | ');
  }

  private cleanExtractedText(text: string): string {
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\t/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  private isTextQualitySufficient(text: string): boolean {
    if (!text || text.length < 100) return false;
    
    const wordCount = text.split(/\s+/).length;
    if (wordCount < 50) return false;
    
    const garbledRatio = this.calculateGarbledRatio(text);
    if (garbledRatio > 0.2) return false;
    
    return true;
  }

  private calculateGarbledRatio(text: string): number {
    const totalChars = text.length;
    if (totalChars === 0) return 1;
    
    const nonAsciiChars = text.match(/[^\x00-\x7F]/g)?.length || 0;
    const specialChars = text.match(/[^\w\s.,;:!?'"()-]/g)?.length || 0;
    
    return (nonAsciiChars + specialChars) / totalChars;
  }

  private calculateTextConfidence(text: string): number {
    const baseConfidence = 0.7;
    const wordCount = text.split(/\s+/).length;
    const garbledRatio = this.calculateGarbledRatio(text);
    
    let confidence = baseConfidence;
    
    if (wordCount > 500) confidence += 0.1;
    if (wordCount > 1000) confidence += 0.1;
    
    confidence -= garbledRatio * 0.5;
    
    return Math.max(0, Math.min(1, confidence));
  }

  private calculateTextractConfidence(response: any): number {
    const blocks = response.Blocks || [];
    if (blocks.length === 0) return 0;
    
    const confidences = blocks
      .filter((b: any) => b.Confidence != null)
      .map((b: any) => b.Confidence / 100);
    
    if (confidences.length === 0) return 0.5;
    
    const avgConfidence = confidences.reduce((sum, c) => sum + c, 0) / confidences.length;
    return avgConfidence;
  }

  redactSensitiveData(text: string): string {
    const ssnPattern = /\b\d{3}-\d{2}-\d{4}\b/g;
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const phonePattern = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g;
    
    let redactedText = text;
    redactedText = redactedText.replace(ssnPattern, '[REDACTED-SSN]');
    redactedText = redactedText.replace(emailPattern, '[REDACTED-EMAIL]');
    redactedText = redactedText.replace(phonePattern, '[REDACTED-PHONE]');
    
    return redactedText;
  }

  hashText(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex');
  }
}