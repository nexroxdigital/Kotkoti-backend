import { Module } from '@nestjs/common';
import { UserSettingService } from './user-setting.service';
import { UserSettingController } from './user-setting.controller';

import { PrismaModule } from '../prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      global: false,
      secret: process.env.JWT_SECRET || 'default-secret',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [UserSettingController],
  providers: [UserSettingService],
})
export class UserSettingModule {}
