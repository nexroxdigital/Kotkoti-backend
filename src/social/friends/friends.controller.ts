import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Param,
  Delete,
  Get,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { FriendsService } from './friends.service';
import { FriendRequestDto } from './dto/friend-request.dto';

@Controller('friends')
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @Post('request')
  @UseGuards(JwtAuthGuard)
  async sendRequest(@Req() req: any, @Body() dto: FriendRequestDto) {
    return this.friendsService.sendFriendRequest(
      req.user.userId,
      dto.targetUserId,
    );
  }

  @Post(':friendId/accept')
  @UseGuards(JwtAuthGuard)
  async accept(@Req() req: any, @Param('friendId') friendId: string) {
    return this.friendsService.acceptFriendRequest(req.user.userId, friendId);
  }

  @Delete(':friendId/cancel-sent-request')
  @UseGuards(JwtAuthGuard)
  async cancel(@Req() req: any, @Param('friendId') friendId: string) {
    return this.friendsService.cancelFriendRequest(req.user.userId, friendId);
  }

  @Delete(':friendId/reject-request')
  @UseGuards(JwtAuthGuard)
  async reject(@Req() req: any, @Param('friendId') friendId: string) {
    return this.friendsService.rejectFriendRequest(req.user.userId, friendId);
  }

  @Delete(':friendId/unfriend')
  @UseGuards(JwtAuthGuard)
  async remove(@Req() req: any, @Param('friendId') friendId: string) {
    return this.friendsService.removeFriend(req.user.userId, friendId);
  }

  @Get('/all')
  @UseGuards(JwtAuthGuard)
  async list(
    @Req() req: any,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    return this.friendsService.listFriends(
      req.user.userId,
      parseInt(page),
      parseInt(limit),
    );
  }

  @Get('requests-sent/all')
  @UseGuards(JwtAuthGuard)
  async listSent(
    @Req() req: any,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    return this.friendsService.listSentRequests(
      req.user.userId,
      parseInt(page),
      parseInt(limit),
    );
  }

  @Get('requests-received/all')
  @UseGuards(JwtAuthGuard)
  async listReceived(
    @Req() req: any,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    return this.friendsService.listReceivedRequests(
      req.user.userId,
      parseInt(page),
      parseInt(limit),
    );
  }

  @Get(':userId/mutual/all')
  @UseGuards(JwtAuthGuard)
  async mutual(@Req() req: any, @Param('userId') targetUserId: string) {
    return this.friendsService.getMutualFriends(req.user.userId, targetUserId);
  }

  @Get('count')
  @UseGuards(JwtAuthGuard)
  async counts(@Req() req: any) {
    return this.friendsService.getFriendCounts(req.user.userId);
  }
}
