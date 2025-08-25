import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import { existsSync } from 'fs';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private s3Client: S3Client | null = null;
  private bucketName: string;
  private storageDriver: 'local' | 's3';
  private localStorageDir: string;

  constructor(private configService: ConfigService) {
    // Determine storage driver
    this.storageDriver = this.configService.get<string>('STORAGE_DRIVER') as 'local' | 's3' || 
                        (this.configService.get<string>('NODE_ENV') === 'development' ? 'local' : 's3');
    
    this.logger.log(`Using storage driver: ${this.storageDriver}`);
    
    if (this.storageDriver === 's3') {
      const region = this.configService.get<string>('AWS_REGION') ?? 'us-east-1';
      const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID') ?? '';
      const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY') ?? '';
      this.s3Client = new S3Client({
        region,
        credentials: accessKeyId && secretAccessKey ? { accessKeyId, secretAccessKey } : undefined,
      });
      this.bucketName = this.configService.get<string>('AWS_S3_BUCKET') ?? '';
    } else {
      // Local storage configuration
      this.localStorageDir = this.configService.get<string>('LOCAL_STORAGE_DIR') ?? './data';
      this.initializeLocalStorage();
    }
  }

  private async initializeLocalStorage(): Promise<void> {
    const dirs = [
      this.localStorageDir,
      path.join(this.localStorageDir, 'contracts'),
      path.join(this.localStorageDir, 'invoices'),
    ];
    
    for (const dir of dirs) {
      if (!existsSync(dir)) {
        await fs.mkdir(dir, { recursive: true });
        this.logger.log(`Created directory: ${dir}`);
      }
    }
  }

  async uploadFile(
    file: Buffer,
    originalName: string,
    mimeType: string,
    folder: 'contracts' | 'invoices',
  ): Promise<{ key: string; url: string }> {
    const fileHash = crypto.createHash('md5').update(file).digest('hex');
    const fileExtension = originalName.split('.').pop();
    const key = `${folder}/${uuidv4()}-${fileHash}.${fileExtension}`;

    try {
      if (this.storageDriver === 's3') {
        const command = new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          Body: file,
          ContentType: mimeType,
          ServerSideEncryption: 'AES256',
          Metadata: {
            originalName,
            uploadDate: new Date().toISOString(),
          },
        });

        await this.s3Client!.send(command);
        
        const url = await this.getSignedUrl(key);
        
        this.logger.log(`File uploaded to S3 successfully: ${key}`);
        return { key, url };
      } else {
        // Local storage
        const filePath = path.join(this.localStorageDir, key);
        await fs.writeFile(filePath, file);
        
        // Save metadata
        const metadataPath = `${filePath}.meta.json`;
        await fs.writeFile(metadataPath, JSON.stringify({
          originalName,
          mimeType,
          uploadDate: new Date().toISOString(),
          size: file.length,
        }));
        
        // Return local URL (will be served by controller)
        const url = `/api/v1/storage/files/${key}`;
        
        this.logger.log(`File uploaded locally: ${key}`);
        return { key, url };
      }
    } catch (error) {
      this.logger.error('Failed to upload file:', error);
      throw new Error('File upload failed');
    }
  }

  async getFile(key: string): Promise<Buffer> {
    try {
      if (this.storageDriver === 's3') {
        const command = new GetObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        });

        const response = await this.s3Client!.send(command);
        const chunks: Uint8Array[] = [];
        
        for await (const chunk of response.Body as any) {
          chunks.push(chunk);
        }
        
        return Buffer.concat(chunks);
      } else {
        // Local storage
        const filePath = path.join(this.localStorageDir, key);
        return await fs.readFile(filePath);
      }
    } catch (error) {
      this.logger.error(`Failed to get file ${key}:`, error);
      throw new Error('File retrieval failed');
    }
  }

  async getFileWithMetadata(key: string): Promise<{
    buffer: Buffer;
    metadata: {
      originalName?: string;
      mimeType?: string;
      uploadDate?: string;
      size?: number;
    };
  }> {
    try {
      if (this.storageDriver === 's3') {
        const buffer = await this.getFile(key);
        const metadata = await this.getFileMetadata(key);
        return {
          buffer,
          metadata: {
            originalName: metadata.metadata.originalName,
            mimeType: metadata.contentType,
            size: metadata.size,
          },
        };
      } else {
        // Local storage
        const filePath = path.join(this.localStorageDir, key);
        const buffer = await fs.readFile(filePath);
        
        // Try to read metadata
        const metadataPath = `${filePath}.meta.json`;
        let metadata = {};
        try {
          const metaContent = await fs.readFile(metadataPath, 'utf-8');
          metadata = JSON.parse(metaContent);
        } catch (err) {
          // Metadata file might not exist
        }
        
        return { buffer, metadata };
      }
    } catch (error) {
      this.logger.error(`Failed to get file with metadata ${key}:`, error);
      throw new Error('File retrieval failed');
    }
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      if (this.storageDriver === 's3') {
        const command = new GetObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        });

        return await getSignedUrl(this.s3Client!, command, { expiresIn });
      } else {
        // For local storage, return the controller endpoint
        return `/api/v1/storage/files/${key}`;
      }
    } catch (error) {
      this.logger.error(`Failed to generate signed URL for ${key}:`, error);
      throw new Error('Signed URL generation failed');
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      if (this.storageDriver === 's3') {
        const command = new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        });

        await this.s3Client!.send(command);
        this.logger.log(`File deleted from S3 successfully: ${key}`);
      } else {
        // Local storage
        const filePath = path.join(this.localStorageDir, key);
        await fs.unlink(filePath);
        
        // Try to delete metadata file
        try {
          await fs.unlink(`${filePath}.meta.json`);
        } catch (err) {
          // Metadata file might not exist
        }
        
        this.logger.log(`File deleted locally: ${key}`);
      }
    } catch (error) {
      this.logger.error(`Failed to delete file ${key}:`, error);
      throw new Error('File deletion failed');
    }
  }

  async fileExists(key: string): Promise<boolean> {
    try {
      if (this.storageDriver === 's3') {
        const command = new HeadObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        });

        await this.s3Client!.send(command);
        return true;
      } else {
        // Local storage
        const filePath = path.join(this.localStorageDir, key);
        try {
          await fs.access(filePath);
          return true;
        } catch {
          return false;
        }
      }
    } catch (error) {
      return false;
    }
  }

  async getFileMetadata(key: string): Promise<{
    size: number;
    contentType: string;
    lastModified: Date;
    metadata: Record<string, string>;
  }> {
    try {
      if (this.storageDriver === 's3') {
        const command = new HeadObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        });

        const response = await this.s3Client!.send(command);
        
        return {
          size: response.ContentLength || 0,
          contentType: response.ContentType || '',
          lastModified: response.LastModified || new Date(),
          metadata: response.Metadata || {},
        };
      } else {
        // Local storage
        const filePath = path.join(this.localStorageDir, key);
        const stats = await fs.stat(filePath);
        
        // Try to read metadata
        let metadata: any = {};
        try {
          const metadataPath = `${filePath}.meta.json`;
          const metaContent = await fs.readFile(metadataPath, 'utf-8');
          metadata = JSON.parse(metaContent);
        } catch (err) {
          // Metadata file might not exist
        }
        
        return {
          size: stats.size,
          contentType: metadata.mimeType || 'application/octet-stream',
          lastModified: stats.mtime,
          metadata: {
            originalName: metadata.originalName || '',
            uploadDate: metadata.uploadDate || stats.birthtime.toISOString(),
          },
        };
      }
    } catch (error) {
      this.logger.error(`Failed to get metadata for ${key}:`, error);
      throw new Error('Metadata retrieval failed');
    }
  }

  generateFileKey(folder: 'contracts' | 'invoices', originalName: string): string {
    const fileExtension = originalName.split('.').pop();
    return `${folder}/${uuidv4()}.${fileExtension}`;
  }
}