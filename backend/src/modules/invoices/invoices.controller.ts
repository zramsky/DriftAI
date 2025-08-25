import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Request,
  HttpCode,
  HttpStatus,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { InvoicesService } from './invoices.service';
import { InvoiceStatus } from '../../entities/invoice.entity';

@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
    },
    fileFilter: (req, file, cb) => {
      if (file.mimetype !== 'application/pdf') {
        return cb(new BadRequestException('Only PDF files are allowed'), false);
      }
      cb(null, true);
    },
  }))
  async uploadInvoice(
    @Query('vendorId') vendorId: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    if (!vendorId) {
      throw new BadRequestException('Vendor ID is required');
    }

    return this.invoicesService.uploadAndProcess(vendorId, file, req.user?.id);
  }

  @Get()
  findAll(
    @Query('vendorId') vendorId?: string,
    @Query('status') status?: InvoiceStatus,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    
    return this.invoicesService.findAll(vendorId, status, start, end);
  }

  @Get('stats')
  getStats(@Query('vendorId') vendorId?: string) {
    return this.invoicesService.getInvoiceStats(vendorId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.invoicesService.findOne(id);
  }

  @Get(':id/status')
  getStatus(@Param('id') id: string) {
    return this.invoicesService.getInvoiceStatus(id);
  }

  @Get(':id/reconciliation')
  getReconciliationReport(@Param('id') id: string) {
    return this.invoicesService.getReconciliationReport(id);
  }

  @Patch(':id/approve')
  approve(@Param('id') id: string, @Request() req: any) {
    return this.invoicesService.approveInvoice(id, req.user?.id);
  }

  @Patch(':id/reject')
  reject(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Request() req: any,
  ) {
    if (!reason) {
      throw new BadRequestException('Rejection reason is required');
    }
    return this.invoicesService.rejectInvoice(id, reason, req.user?.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @Request() req: any) {
    return this.invoicesService.softDelete(id, req.user?.id);
  }
}