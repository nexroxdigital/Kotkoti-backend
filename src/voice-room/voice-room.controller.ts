import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { User } from '@prisma/client';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { VoiceRoomService } from './voice-room.service';

export interface RequestWithUser extends Request {
  user: User;
}

@UseGuards(JwtAuthGuard)
@Controller('voice-room')
export class VoiceRoomController {
  constructor(private readonly voiceRoomService: VoiceRoomService) {}

  // create new room
  @Post('create')
  async createRoom(
    @Req() req: RequestWithUser,
    @Body('roomName') roomName: string,
  ) {
    // Get hostId from authenticated user
    const hostId = (req.user as any).userId;

    // console.log('hostId', hostId);

    if (!roomName) {
      throw new Error('Room name is required');
    }

    // Call service to create room
    const roomData = await this.voiceRoomService.createRoom(hostId, roomName);

    return roomData;
  }

  /**
   * User attempts to join a room
   */
  // @Post('join')
  // async joinRoom(@Req() req: RequestWithUser, @Body('roomId') roomId: string) {
  //   const userId = (req.user as any).userId;

  //   const result = await this.voiceRoomService.joinRoom(userId, roomId);

  //   return result; // contains action: REQUEST_REQUIRED or JOIN_ALLOWED
  // }

  /**
   * Optional: host can approve join request via API (instead of socket)
   */
  // @Post('join/approve')
  // async approveJoin(@Req() req, @Body('requestId') requestId: string) {
  //   const hostId = req.user.userId;
  //   return await this.voiceRoomService.approveJoinRequest(requestId, hostId);
  // }

  /**
   * Optional: host can reject join request via API
   */
  // @Post('join/reject')
  // async rejectJoin(@Req() req, @Body('requestId') requestId: string) {
  //   const hostId = req.user.userId;
  //   return await this.voiceRoomService.rejectJoinRequest(requestId, hostId);
  // }
}
