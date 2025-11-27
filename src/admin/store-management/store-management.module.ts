import { Module } from '@nestjs/common';
import { StoreManagementService } from './store-management.service';
import { StoreManagementController } from './store-management.controller';
import { StoreCategoryService } from './store-category.service';

@Module({
  controllers: [StoreManagementController],
  providers: [StoreManagementService, StoreCategoryService],
})
export class StoreManagementModule {}
