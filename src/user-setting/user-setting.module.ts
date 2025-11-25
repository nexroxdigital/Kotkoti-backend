import { Module } from '@nestjs/common';
import { UserSettingService } from './user-setting.service';
import { UserSettingController } from './user-setting.controller';

@Module({
  controllers: [UserSettingController],
  providers: [UserSettingService],
})
export class UserSettingModule {}
