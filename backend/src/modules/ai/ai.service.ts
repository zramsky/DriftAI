import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import Ajv from 'ajv';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private openai: OpenAI;
  private ajv: Ajv;

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get('OPENAI_API_KEY'),
      organization: this.configService.get('OPENAI_ORG_ID'),
    });
    this.ajv = new Ajv();
  }

  async extractWithSchema(
    text: string,
    systemPrompt: string,
    schema: any,
    model: string = 'gpt-4o-mini',
  ): Promise<any> {
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

      const result = JSON.parse(completion.choices[0].message.content);
      
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

      return completion.choices[0].message.content;
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
}