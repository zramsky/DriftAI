import { Controller, Get, Param, Res, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { Response } from 'express';
import { StorageService } from './storage.service';

@Controller('storage')
export class StorageController {
  private readonly logger = new Logger(StorageController.name);

  constructor(private readonly storageService: StorageService) {}

  @Get('files/:folder/:filename')
  async downloadFile(
    @Param('folder') folder: string,
    @Param('filename') filename: string,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const key = `${folder}/${filename}`;
      
      // Validate folder name
      if (!['contracts', 'invoices'].includes(folder)) {
        throw new HttpException('Invalid folder', HttpStatus.BAD_REQUEST);
      }
      
      // Check if file exists
      const exists = await this.storageService.fileExists(key);
      if (!exists) {
        throw new HttpException('File not found', HttpStatus.NOT_FOUND);
      }
      
      // Get file with metadata
      const { buffer, metadata } = await this.storageService.getFileWithMetadata(key);
      
      // Set response headers
      res.set({
        'Content-Type': metadata.mimeType || 'application/octet-stream',
        'Content-Disposition': `inline; filename="${metadata.originalName || filename}"`,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'private, max-age=3600',
      });
      
      // Send file
      res.send(buffer);
      
      this.logger.log(`File served: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to serve file: ${folder}/${filename}`, error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Failed to download file',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('files/:path(*)')
  async downloadFileWithPath(
    @Param('path') path: string,
    @Res() res: Response,
  ): Promise<void> {
    try {
      // Handle paths like "contracts/uuid.pdf" or "invoices/uuid.pdf"
      const parts = path.split('/');
      if (parts.length !== 2) {
        throw new HttpException('Invalid file path', HttpStatus.BAD_REQUEST);
      }
      
      const [folder, filename] = parts;
      return this.downloadFile(folder, filename, res);
    } catch (error) {
      this.logger.error(`Failed to serve file: ${path}`, error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Failed to download file',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}