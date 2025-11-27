import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { StoreManagementService } from './store-management.service';
import { CreateStoreCategoryDto } from './dto/create-store-category.dto';
import { UpdateStoreCategoryDto } from './dto/update-store-category.dto';
import { StoreCategoryService } from './store-category.service';
import { CreateStoreItemDto } from './dto/create-store-item.dto';
import { UpdateStoreItemDto } from './dto/update-store-item.dto';

@Controller('store-management')
export class StoreManagementController {
  constructor(
    private storeManagementService: StoreManagementService,
    private storeCategoryService: StoreCategoryService,
  ) {}

  // @desc    Store Category Management Controller
  //          Handles creation, retrieval, updating, and deletion of
  //          store categories. Ensures proper validation, organizes
  //          category hierarchy, and interacts with the StoreCategoryService
  //          for database operations.

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

  // @desc    Store Items Management Controller
  //          Handles all operations related to creating, retrieving,
  //          updating, and deleting store items. This includes validating
  //          incoming data, interacting with the StoreItemsService, and
  //          returning consistent API responses.

  //  Create a new store item
  @Post('store-items/add')
  createItem(@Body() dto: CreateStoreItemDto) {
    return this.storeManagementService.createItem(dto);
  }

  //  Get all store items
  @Get('store-items/all')
  findAllItems() {
    return this.storeManagementService.findAllItem();
  }

  //  Get a single store item by ID
  @Get('store-items/details/:itemId')
  findOneItem(@Param('itemId') id: string) {
    return this.storeManagementService.findOneItem(id);
  }

  //  Update a store item by ID
  @Patch('store-items/update/:itemId')
  updateItem(@Param('itemId') id: string, @Body() dto: UpdateStoreItemDto) {
    return this.storeManagementService.updateItem(id, dto);
  }

  // @desc Delete a store item by ID
  @Delete('store-items/delete/:itemId')
  deleteItem(@Param('itemId') id: string) {
    return this.storeManagementService.deleteItem(id);
  }
}
