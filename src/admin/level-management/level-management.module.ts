import { Module } from '@nestjs/common';
import { LevelManagementService } from './level-management.service';
import { LevelManagementController } from './level-management.controller';

@Module({
  controllers: [LevelManagementController],
  providers: [LevelManagementService],
})
export class LevelManagementModule {}
