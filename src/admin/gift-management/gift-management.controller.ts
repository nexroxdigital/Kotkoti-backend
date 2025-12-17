import { Controller, Get, Post, Put, Body, Param } from '@nestjs/common';

import { GiftManagementService } from './gift-management.service';
import {
  CreateGiftCategoryDto,
  UpdateGiftCategoryDto,
} from './dto/gift-category.dto';
import { CreateGiftDto, UpdateGiftDto } from './dto/gift.dto';

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

  //  Gift Routes
  @Post('gifts/add')
  createGift(@Body() dto: CreateGiftDto) {
    return this.giftManagementService.createGift(dto);
  }

  @Get('gifts/all')
  findAllGifts() {
    return this.giftManagementService.findAllGifts();
  }

  @Get('gifts/details/:giftId')
  findOneGift(@Param('id') id: string) {
    return this.giftManagementService.findOneGift(id);
  }

  @Put('gifts/update/:giftId')
  updateGift(@Param('id') id: string, @Body() dto: UpdateGiftDto) {
    return this.giftManagementService.updateGift(id, dto);
  }
}
