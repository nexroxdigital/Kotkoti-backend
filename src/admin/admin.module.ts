import { Module } from '@nestjs/common';
import { StoreManagementModule } from './store-management/store-management.module';
import { ReSellerManagementModule } from './re-seller-management/re-seller-management.module';
import { LevelManagementModule } from './level-management/level-management.module';
import { GiftManagementModule } from './gift-management/gift-management.module';
import { SvipManagementModule } from './svip-management/svip-management.module';
import { AdminAuthModule } from './admin-auth/admin-auth.module';

@Module({
  imports: [StoreManagementModule, ReSellerManagementModule, LevelManagementModule, GiftManagementModule, SvipManagementModule, AdminAuthModule],
})
export class AdminModule {}
