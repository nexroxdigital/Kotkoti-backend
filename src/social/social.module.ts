import { Module } from '@nestjs/common';
import { SocialController } from './social.controller';
import { SocialService } from './social.service';
import { FriendsModule } from './friends/friends.module';


@Module({
  controllers: [SocialController],
  providers: [SocialService],
  imports: [FriendsModule],
})
export class SocialModule {}
