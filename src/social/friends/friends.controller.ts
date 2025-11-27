import { Controller, Post, Body, UseGuards, Req, Param } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { FriendsService } from './friends.service';
import { FriendRequestDto } from './dto/friend-request.dto';

@Controller('friends')
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @Post('request')
  @UseGuards(JwtAuthGuard)
  async sendRequest(@Req() req: any, @Body() dto: FriendRequestDto) {
    return this.friendsService.sendFriendRequest(req.user.userId, dto.targetUserId);
  }


  @Post(':friendId/accept')
@UseGuards(JwtAuthGuard)
async accept(
  @Req() req: any,
  @Param('friendId') friendId: string,
) {
  return this.friendsService.acceptFriendRequest(req.user.userId, friendId);
}

}
