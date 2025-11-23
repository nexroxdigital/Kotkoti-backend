import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { User } from '@prisma/client';
import type { Request } from 'express';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { SocialService } from './social.service';

export interface RequestWithUser extends Request {
  user: User;
}

@Controller('users')
@UseGuards(JwtAuthGuard)
export class SocialController {
  constructor(private readonly focialService: SocialService) {}

  // Follow a user
  @Post(':userId/follow')
  follow(@Param('userId') userId: string, @Req() req: RequestWithUser) {
    const followerId = (req.user as any).id;
    return this.focialService.followUser(userId, followerId);
  }

  // Unfollow a user
  @Delete(':userId/unfollow')
  unfollow(@Param('userId') userId: string, @Req() req: RequestWithUser) {
    const followerId = (req.user as any).id;
    return this.focialService.unfollowUser(userId, followerId);
  }

  // Get followers of current user
  @Get('me/followers')
  getFollowers(@Req() req: RequestWithUser) {
    const userId = (req.user as any).id;
    return this.focialService.getFollowers(userId);
  }

  // Get following of current user
  @Get('me/following')
  getFollowing(@Req() req: RequestWithUser) {
    const followerId = (req.user as any).id;
    return this.focialService.getFollowing(followerId);
  }
}
