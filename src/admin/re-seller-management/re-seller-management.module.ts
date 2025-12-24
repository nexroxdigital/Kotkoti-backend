import { Module } from '@nestjs/common';
import { ReSellerManagementService } from './re-seller-management.service';
import { ReSellerManagementController } from './re-seller-management.controller';

@Module({
  controllers: [ReSellerManagementController],
  providers: [ReSellerManagementService],
})
export class ReSellerManagementModule {}
