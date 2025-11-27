import { Module } from '@nestjs/common';
import { StoreManagementModule } from './store-management/store-management.module';

@Module({
  imports: [StoreManagementModule],
})
export class AdminModule {}
