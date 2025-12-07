import { Module } from '@nestjs/common';
import { SvipManagementService } from './svip-management.service';
import { SvipManagementController } from './svip-management.controller';

@Module({
  controllers: [SvipManagementController],
  providers: [SvipManagementService],
})
export class SvipManagementModule {}
