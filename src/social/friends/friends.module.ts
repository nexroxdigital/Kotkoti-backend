import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { FriendsService } from './friends.service';
import { FriendsController } from './friends.controller';

@Module({
  imports: [PrismaModule],
  providers: [FriendsService],
  controllers: [FriendsController],
})
export class FriendsModule {}
