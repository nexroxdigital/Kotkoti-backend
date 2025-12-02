import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
  Request,
} from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { RoomBanService } from './room-ban.service';
import { SeatsService } from '../seats/seats.service';
import { RequestSeatDto } from '../seats/dto/request-seat.dto';
import { ApproveSeatDto } from '../seats/dto/approve-seat.dto';
import { Provider } from '@prisma/client';
import { RtcService } from '../rtc/rtc.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

class CreateRoomDto {
  name: string;
  provider?: Provider;
}

@Controller('rooms')
export class RoomsController {
  constructor(
    private roomsService: RoomsService,
    private roomBanService: RoomBanService,
    private seatsService: SeatsService,
    private rtcService: RtcService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async listRooms() {
    return this.roomsService.listRooms();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getRoomDetail(@Param('id') id: string) {
    return this.roomsService.getRoomDetail(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async createRoom(@Body() dto: CreateRoomDto, @Request() req) {
    const userId = req.user.userId;
    const provider = dto.provider || 'AGORA';
    const room = await this.roomsService.createRoom(dto.name, userId, provider);
    return { room };
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async endRoom(@Param('id') id: string, @Request() req) {
    const userId = req.user.userId;
    return this.roomsService.endRoom(id, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getRoom(@Param('id') id: string) {
    return this.roomsService.getRoom(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/join')
  async joinRoom(@Param('id') id: string, @Request() req) {
    const userId = req.user.userId;
    return this.roomsService.joinRoom(id, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/leave')
  async leaveRoom(@Param('id') id: string, @Request() req) {
    const userId = req.user.userId;
    return this.roomsService.leaveRoom(id, userId);
  }

  // Seats
  @UseGuards(JwtAuthGuard)
  @Post(':id/seat/request')
  async requestSeat(
    @Param('id') id: string,
    @Body() dto: RequestSeatDto,
    @Request() req,
  ) {
    return this.seatsService.requestSeat(id, req.user.userId, dto.seatIndex);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/seat/approve')
  async approveSeat(
    @Param('id') id: string,
    @Body() dto: ApproveSeatDto,
    @Request() req,
  ) {
    return this.seatsService.approveSeatRequest(
      dto.requestId,
      req.user.userId,
      dto.accept,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/seat/leave')
  async leaveSeat(@Param('id') id: string, @Request() req) {
    return this.seatsService.leaveSeat(id, req.user.userId);
  }

  // Ban
  @UseGuards(JwtAuthGuard)
  @Post(':id/ban')
  async banUser(
    @Param('id') id: string,
    @Body() body: { userId: string; reason?: string },
    @Request() req,
  ) {
    return this.roomBanService.banUser(
      id,
      req.user.userId,
      body.userId,
      body.reason,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/ban/:userId')
  async unbanUser(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Request() req,
  ) {
    return this.roomBanService.unbanUser(id, req.user.userId, userId);
  }

  // RTC token refresh
  @UseGuards(JwtAuthGuard)
  @Post(':id/rtc/refresh')
  async refreshToken(@Param('id') id: string, @Request() req) {
    const room = await this.roomsService.getRoom(id);
    return this.rtcService.issueToken(
      room.provider,
      id,
      req.user.userId,
      'publisher',
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/rtc/disconnect')
  async disconnectRtc(
    @Param('id') id: string,
    @Body() body: { userId?: string },
    @Request() req,
  ) {
    const room = await this.roomsService.getRoom(id);
    if (room.hostId !== req.user.userId) {
      throw new Error('Only host can disconnect');
    }
    if (body.userId) {
      await this.rtcService.disconnectUser(room.provider, id, body.userId);
    } else {
      await this.rtcService.disconnectRoom(room.provider, id);
    }
    return { ok: true };
  }
}
