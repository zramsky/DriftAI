import {
  Controller,
  Get,
  Post,
  Body,
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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ContractsService } from './contracts.service';
import { UpdateContractDto } from './dto/update-contract.dto';
import { ContractStatus } from '../../entities/contract.entity';

@Controller('contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

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
  async uploadContract(
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

    return this.contractsService.uploadAndProcess(vendorId, file, req.user?.id);
  }

  @Get()
  findAll(
    @Query('vendorId') vendorId?: string,
    @Query('status') status?: ContractStatus,
  ) {
    return this.contractsService.findAll(vendorId, status);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.contractsService.findOne(id);
  }

  @Get(':id/status')
  getStatus(@Param('id') id: string) {
    return this.contractsService.getContractStatus(id);
  }

  @Get(':id/terms')
  getTerms(@Param('id') id: string) {
    return this.contractsService.getContractTerms(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateContractDto: UpdateContractDto,
    @Request() req: any,
  ) {
    return this.contractsService.update(id, updateContractDto, req.user?.id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: ContractStatus,
    @Request() req: any,
  ) {
    return this.contractsService.updateStatus(id, status, req.user?.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @Request() req: any) {
    return this.contractsService.softDelete(id, req.user?.id);
  }
}