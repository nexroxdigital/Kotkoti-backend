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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
//import { bannerMulterConfig } from 'src/common/multer.config';
import { BannerManagementService } from './banner-management.service';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';

@Controller('banner-management')
export class BannerManagementController {
  constructor(
    private readonly bannerManagementService: BannerManagementService,
  ) {}

  @Post('add')
  //@UseInterceptors(FileInterceptor('image', bannerMulterConfig))
  async create(
    @Body() dto: CreateBannerDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (file) {
      dto.imgUrl = `/uploads/banners/${file.filename}`;
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
  //@UseInterceptors(FileInterceptor('image', bannerMulterConfig))
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
