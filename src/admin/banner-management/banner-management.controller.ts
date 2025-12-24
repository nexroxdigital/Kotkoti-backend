import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BannerManagementService } from './banner-management.service';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { bannerMulterConfig } from 'src/common/multer.config';
import { FileCleanupInterceptor } from '../../common/interceptors/file-cleanup.interceptor';

@Controller('banner-management')
@UseInterceptors(FileCleanupInterceptor)
export class BannerManagementController {
  constructor(
    private readonly bannerManagementService: BannerManagementService,
  ) {}

  @Post('add')
  @UseInterceptors(FileInterceptor('imgUrl', bannerMulterConfig))
  async create(
    @Body() dto: CreateBannerDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (file) {
      dto.imgUrl = `/uploads/banners/${file.filename}`;
    }

    if (!dto.imgUrl) {
      throw new BadRequestException('Banner image is required');
    }

    return await this.bannerManagementService.create(dto);
  }

  @Get('all')
  findAll() {
    return this.bannerManagementService.findAll();
  }

  @Get('details/:bannerId')
  findOne(@Param('bannerId', ParseIntPipe) id: number) {
    return this.bannerManagementService.findOne(id);
  }

  @Put('update/:bannerId')
  @UseInterceptors(FileInterceptor('imgUrl', bannerMulterConfig))
  async update(
    @Param('bannerId', ParseIntPipe) id: number,
    @Body() dto: UpdateBannerDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (file) {
      dto.imgUrl = `/uploads/banners/${file.filename}`;
    }
    return await this.bannerManagementService.update(id, dto);
  }

  @Delete('delete/:bannerId')
  remove(@Param('bannerId', ParseIntPipe) id: number) {
    return this.bannerManagementService.remove(id);
  }
}
