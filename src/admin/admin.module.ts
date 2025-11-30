import { Module } from '@nestjs/common';
import { StoreManagementModule } from './store-management/store-management.module';
import { ReSellerManagementModule } from './re-seller-management/re-seller-management.module';

@Module({
  imports: [StoreManagementModule, ReSellerManagementModule],
})
export class AdminModule {}
