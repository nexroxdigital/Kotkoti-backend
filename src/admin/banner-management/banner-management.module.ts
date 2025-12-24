import { Module } from '@nestjs/common';
import { BannerManagementService } from './banner-management.service';
import { BannerManagementController } from './banner-management.controller';

@Module({
  controllers: [BannerManagementController],
  providers: [BannerManagementService],
})
export class BannerManagementModule {}
