import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  Delete,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { unlinkSync } from 'fs';
import { GiftManagementService } from './gift-management.service';
import {
  CreateGiftCategoryDto,
  UpdateGiftCategoryDto,
} from './dto/gift-category.dto';
import { CreateGiftDto, UpdateGiftDto } from './dto/gift.dto';
import { giftMulterConfig } from '../../common/multer.config';

@Controller('gift-management')
export class GiftManagementController {
  constructor(private readonly giftManagementService: GiftManagementService) {}

  //  GiftCategory Routes
  @Post('categories/add')
  createCategory(@Body() dto: CreateGiftCategoryDto) {
    return this.giftManagementService.createCategory(dto);
  }

  @Get('categories/all')
  findAllCategories() {
    return this.giftManagementService.findAllCategories();
  }

  @Get('categories/detail/:categoryId')
  findOneCategory(@Param('id') id: string) {
    return this.giftManagementService.findOneCategory(id);
  }

  @Put('categories/update/:categoryId')
  updateCategory(@Param('id') id: string, @Body() dto: UpdateGiftCategoryDto) {
    return this.giftManagementService.updateCategory(id, dto);
  }

  // Delete a store category by id
  @Delete('categories/delete/:id')
  remove(@Param('id') id: string) {
    return this.giftManagementService.deleteCategory(id);
  }

  //  Gift Routes
  @Post('gifts/add')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'giftIcon', maxCount: 1 },
        { name: 'swf', maxCount: 1 },
      ],
      giftMulterConfig,
    ),
  )
  async createGift(
    @Body() dto: CreateGiftDto,
    @UploadedFiles()
    files: { giftIcon?: Express.Multer.File[]; swf?: Express.Multer.File[] },
  ) {
    if (files.giftIcon) {
      dto.giftIcon = `/uploads/gifts/${files.giftIcon[0].filename}`;
    }
    if (files.swf) {
      dto.swf = `/uploads/gifts/${files.swf[0].filename}`;
    }

    if (!dto.giftIcon) {
      if (files?.swf) unlinkSync(files.swf[0].path);
      throw new BadRequestException('giftIcon is required');
    }
    if (!dto.swf) {
      if (files?.giftIcon) unlinkSync(files.giftIcon[0].path);
      throw new BadRequestException('swf is required');
    }

    try {
      return await this.giftManagementService.createGift(dto);
    } catch (error) {
      if (files?.giftIcon) unlinkSync(files.giftIcon[0].path);
      if (files?.swf) unlinkSync(files.swf[0].path);
      throw error;
    }
  }

  @Get('gifts/all')
  findAllGifts() {
    return this.giftManagementService.findAllGifts();
  }

  @Get('gifts/by-category/:categoryId')
  findGiftsByCategory(@Param('categoryId') categoryId: string) {
    return this.giftManagementService.findGiftsByCategory(categoryId);
  }

  @Get('gifts/details/:giftId')
  findOneGift(@Param('id') id: string) {
    return this.giftManagementService.findOneGift(id);
  }

  @Put('gifts/update/:giftId')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'giftIcon', maxCount: 1 },
        { name: 'swf', maxCount: 1 },
      ],
      giftMulterConfig,
    ),
  )
  async updateGift(
    @Param('id') id: string,
    @Body() dto: UpdateGiftDto,
    @UploadedFiles()
    files: { giftIcon?: Express.Multer.File[]; swf?: Express.Multer.File[] },
  ) {
    if (files?.giftIcon) {
      dto.giftIcon = `/uploads/gifts/${files.giftIcon[0].filename}`;
    }
    if (files?.swf) {
      dto.swf = `/uploads/gifts/${files.swf[0].filename}`;
    }

    try {
      return await this.giftManagementService.updateGift(id, dto);
    } catch (error) {
      if (files?.giftIcon) unlinkSync(files.giftIcon[0].path);
      if (files?.swf) unlinkSync(files.swf[0].path);
      throw error;
    }
  }

  @Delete('gifts/delete/:giftId')
  deleteGift(@Param('giftId') id: string) {
    return this.giftManagementService.deleteGift(id);
  }
}
