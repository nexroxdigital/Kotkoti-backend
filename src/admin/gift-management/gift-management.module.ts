import { Module } from '@nestjs/common';
import { GiftManagementService } from './gift-management.service';
import { GiftManagementController } from './gift-management.controller';

@Module({
  controllers: [GiftManagementController],
  providers: [GiftManagementService],
})
export class GiftManagementModule {}
