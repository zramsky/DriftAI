import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { VendorsService } from './vendors.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';

@Controller('vendors')
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createVendorDto: CreateVendorDto, @Request() req: any) {
    return this.vendorsService.create(createVendorDto, req.user?.id);
  }

  @Get()
  findAll(@Query('includeInactive') includeInactive?: string) {
    return this.vendorsService.findAll(includeInactive === 'true');
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.vendorsService.findOne(id);
  }

  @Get(':id/stats')
  getStats(@Param('id') id: string) {
    return this.vendorsService.getVendorStats(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateVendorDto: UpdateVendorDto,
    @Request() req: any,
  ) {
    return this.vendorsService.update(id, updateVendorDto, req.user?.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @Request() req: any) {
    return this.vendorsService.softDelete(id, req.user?.id);
  }

  @Post(':id/restore')
  restore(@Param('id') id: string, @Request() req: any) {
    return this.vendorsService.restore(id, req.user?.id);
  }
}