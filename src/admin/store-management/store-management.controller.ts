import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { StoreManagementService } from './store-management.service';
import { CreateStoreCategoryDto } from './dto/create-store-category.dto';
import { UpdateStoreCategoryDto } from './dto/update-store-category.dto';
import { StoreCategoryService } from './store-category.service';
import { CreateStoreItemDto } from './dto/create-store-item.dto';
import { UpdateStoreItemDto } from './dto/update-store-item.dto';
import { storeItemMulterConfig } from '../../common/multer.config';
import { FileCleanupInterceptor } from '../../common/interceptors/file-cleanup.interceptor';

@Controller('store-management')
@UseInterceptors(FileCleanupInterceptor)
export class StoreManagementController {
  constructor(
    private storeManagementService: StoreManagementService,
    private storeCategoryService: StoreCategoryService,
  ) {}

  // @desc Store Category Management Controller

  // Create a new store category
  @Post('store-category/add')
  create(@Body() dto: CreateStoreCategoryDto) {
    return this.storeCategoryService.createCategory(dto);
  }

  // Get all store categories
  @Get('store-category/all')
  findAll() {
    return this.storeCategoryService.findAllCategory();
  }

  // Get a single store category by id
  @Get('store-category/:id')
  findOne(@Param('id') id: string) {
    return this.storeCategoryService.findOneCategory(id);
  }

  // Update a store category by id
  @Patch('store-category/update/:id')
  update(@Param('id') id: string, @Body() dto: UpdateStoreCategoryDto) {
    return this.storeCategoryService.updateOneCategory(id, dto);
  }

  // Delete a store category by id
  @Delete('store-category/delete/:id')
  remove(@Param('id') id: string) {
    return this.storeCategoryService.deleteCategory(id);
  }

  // @desc Store Items Management Controller

  //  Create a new store item
  @Post('store-items/add')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'icon', maxCount: 1 },
        { name: 'swf', maxCount: 1 },
      ],
      storeItemMulterConfig,
    ),
  )
  async createItem(
    @Body() dto: CreateStoreItemDto,
    @UploadedFiles()
    files: { icon?: Express.Multer.File[]; swf?: Express.Multer.File[] },
  ) {
    if (files?.icon) {
      dto.icon = `/uploads/store/${files.icon[0].filename}`;
    }
    if (files?.swf) {
      dto.swf = `/uploads/store/${files.swf[0].filename}`;
    }

    if (!dto.icon) throw new BadRequestException('icon is required');

    return await this.storeManagementService.createItem(dto);
  }

  //  Get all store items
  @Get('store-items/all')
  findAllItems() {
    return this.storeManagementService.findAllItem();
  }

  // Get  store items by category
  @Get('store-items/by-category/:categoryId')
  findItemByCategory(@Param('categoryId') categoryId: string) {
    return this.storeManagementService.findItemByCategory(categoryId);
  }

  //  Get a single store item by ID
  @Get('store-items/details/:itemId')
  findOneItem(@Param('itemId') id: string) {
    return this.storeManagementService.findOneItem(id);
  }

  //  Update a store item by ID
  @Patch('store-items/update/:itemId')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'icon', maxCount: 1 },
        { name: 'swf', maxCount: 1 },
      ],
      storeItemMulterConfig,
    ),
  )
  async updateItem(
    @Param('itemId') id: string,
    @Body() dto: UpdateStoreItemDto,
    @UploadedFiles()
    files: { icon?: Express.Multer.File[]; swf?: Express.Multer.File[] },
  ) {
    if (files?.icon) {
      dto.icon = `/uploads/store/${files.icon[0].filename}`;
    }
    if (files?.swf) {
      dto.swf = `/uploads/store/${files.swf[0].filename}`;
    }

    return await this.storeManagementService.updateItem(id, dto);
  }

  // @desc Delete a store item by ID
  @Delete('store-items/delete/:itemId')
  deleteItem(@Param('itemId') id: string) {
    return this.storeManagementService.deleteItem(id);
  }
}
