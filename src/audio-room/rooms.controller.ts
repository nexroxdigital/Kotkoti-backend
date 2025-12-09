import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
  Request,
  Req,
  ForbiddenException,
  NotFoundException,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Patch,
} from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { RoomBanService } from './room-ban.service';
import { SeatsService } from '../seats/seats.service';
import { RequestSeatDto } from '../seats/dto/request-seat.dto';
import { ApproveSeatDto } from '../seats/dto/approve-seat.dto';
import { Provider } from '@prisma/client';
import { RtcService } from '../rtc/rtc.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RoomGateway } from 'src/gateway/room.gateway';
import { KickService } from './kick.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { roomImageMulterConfig } from 'src/common/multer.config';
import { UpdateRoomDto } from './dto/UpdateRoomDto';

@Controller('audio-room')
export class RoomsController {
  constructor(
    private roomsService: RoomsService,
    private roomBanService: RoomBanService,
    private seatsService: SeatsService,
    private kickService: KickService,
    private rtcService: RtcService,
    private roomGateway: RoomGateway,
  ) {}

  // ============================
  // ROOMS
  // ============================

  @UseGuards(JwtAuthGuard)
  @Get('/all')
  async listRooms() {
    const rooms = await this.roomsService.listRooms();
    return { success: true, rooms };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/details')
  async getRoomDetail(@Param('id') id: string) {
    const room = await this.roomsService.getRoomDetail(id);
    return { success: true, room };
  }
  @Get('/my')
  @UseGuards(JwtAuthGuard)
  async getMyRoom(@Req() req) {
    const hostId = req.user.userId;

    const room = await this.roomsService.getRoomByHost(hostId);

    return { success: true, room };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/rtc-uid')
  async updateRtcUid(
    @Req() req,
    @Param('id') roomId: string,
    @Body() body: { rtcUid: number },
  ) {
    const result = await this.roomsService.updateRtcUid(
      req.user.userId,
      roomId,
      body.rtcUid,
    );
    return { success: true, data: result };
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('image', roomImageMulterConfig))
  async createRoom(
    @Req() req,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateRoomDto,
  ) {
    const hostId = req.user.userId;

    // Ensure tags always becomes array
    const tags = Array.isArray(dto.tags)
      ? dto.tags
      : dto.tags
        ? [dto.tags]
        : [];

    // STEP 1 → Create room first (without image)
    const room = await this.roomsService.createRoom({
      name: dto.name,
      tags,
      seatCount: Number(dto.seatCount),
      imageUrl: null,
      hostId,
    });

    // STEP 2 → If image uploaded → process it
    if (file) {
      const imageUrl = await this.roomsService.processRoomImage(room.id, file);
      await this.roomsService.updateRoomImage(room.id, imageUrl);

      room.imageUrl = imageUrl;
    }

    return {
      message: 'Room created successfully',
      room,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async endRoom(@Param('id') id: string, @Request() req) {
    const room = await this.roomsService.getRoom(id);

    if (room.hostId !== req.user.userId) {
      throw new ForbiddenException('Only host can end room');
    }

    const result = await this.roomsService.endRoom(id, req.user.userId);
    return { success: true, data: result };
  }

  @Patch(':id/update')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('image', roomImageMulterConfig))
  async updateRoom(
    @Param('id') roomId: string,
    @Req() req,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UpdateRoomDto,
  ) {
    const userId = req.user.userId;

    const normalizedDto = {
      name: dto.name,
      // tags can be string | string[]
      tags: Array.isArray(dto.tags) ? dto.tags : dto.tags ? [dto.tags] : [],

      // FIX: convert seatCount to number if sent as string
      seatCount:
        dto.seatCount !== undefined && dto.seatCount !== null
          ? Number(dto.seatCount)
          : undefined,
    };

    const updated = await this.roomsService.updateRoom(
      roomId,
      userId,
      normalizedDto,
      file,
    );

    return { success: true, room: updated };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/rtc/publisher')
  async getPublisherToken(@Param('id') roomId: string, @Request() req) {
    const userId = req.user.userId;
    return this.roomsService.issuePublisherTokenForUser(roomId, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/join')
  async joinRoom(@Param('id') id: string, @Request() req) {
    const result = await this.roomsService.joinRoom(id, req.user.userId);
    return { success: true, data: result };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/leave')
  async leaveRoom(@Param('id') id: string, @Request() req) {
    const result = await this.roomsService.leaveRoom(id, req.user.userId);
    return { success: true, data: result };
  }

  // ============================
  // SEATS
  // ============================

  @UseGuards(JwtAuthGuard)
  @Post(':id/seat/mode')
  async changeSeatMode(
    @Param('id') roomId: string,
    @Body() body: { seatIndex: number; mode: 'FREE' | 'REQUEST' | 'LOCKED' },
    @Request() req,
  ) {
    const userId = req.user.userId;
    const seats = await this.seatsService.changeSeatMode(
      roomId,
      userId,
      body.seatIndex,
      body.mode,
    );
    this.roomGateway.broadcastSeatUpdate(roomId, seats);
    return { ok: true, seats };
  }

  @Patch(':id/seat/mode/toggle')
  @UseGuards(JwtAuthGuard)
  async toggleSeatMode(
    @Param('id') roomId: string,
    @Req() req,
    @Body() dto: { mode: 'FREE' | 'REQUEST' },
  ) {
    const userId = req.user.userId;

    const seats = await this.seatsService.bulkToggleFreeRequest(
      roomId,
      userId,
      dto.mode,
    );

    // push to all clients
    this.roomGateway.broadcastSeatUpdate(roomId, seats);
    return { success: true, seats };
  }

  @Patch(':id/seat-count')
  @UseGuards(JwtAuthGuard)
  async changeSeatCount(
    @Param('id') roomId: string,
    @Body() dto: { seatCount: number },
    @Req() req,
  ) {
    const userId = req.user.userId;

    const seats = await this.seatsService.changeSeatCount(
      roomId,
      userId,
      dto.seatCount,
    );

    // push to all clients
    this.roomGateway.broadcastSeatUpdate(roomId, seats);

    return { success: true, seats };
  }

  @Post(':id/seat/take')
  @UseGuards(JwtAuthGuard)
  async takeSeat(
    @Param('id') roomId: string,
    @Body() dto: { seatIndex: number },
    @Request() req,
  ) {
    const seats = await this.seatsService.takeSeat(
      roomId,
      dto.seatIndex,
      req.user.userId,
    );
    this.roomGateway.broadcastSeatUpdate(roomId, seats);
    return { ok: true, seats };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/seat/request')
  async requestSeat(
    @Param('id') roomId: string,
    @Body() dto: RequestSeatDto,
    @Request() req,
  ) {
    const request = await this.seatsService.requestSeat(
      roomId,
      req.user.userId,
      dto.seatIndex,
    );

    // Fail-safe socket emit
    try {
      await this.roomGateway.emitSeatRequest(roomId, request);
    } catch (e) {
      console.warn('Failed to emit seat.request', e);
    }

    return { success: true, request };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':roomId/seat/approve')
  async approveSeat(
    @Param('roomId') roomId: string,
    @Body() dto: ApproveSeatDto,
    @Request() req,
  ) {
    const hostId = req.user.userId;

    const room = await this.roomsService.getRoom(roomId);
    if (!room) throw new NotFoundException('Room not found');

    if (room.hostId !== hostId)
      throw new ForbiddenException('Only host can approve or deny seats');

    // Perform seat switch / approval
    const result = await this.seatsService.approveSeatRequest(
      dto.requestId,
      hostId,
      dto.accept,
    );

    // Always reload seats
    const seats = await this.seatsService['prisma'].seat.findMany({
      where: { roomId },
      orderBy: { index: 'asc' },
      include: {
        user: {
          select: {
            id: true,
            nickName: true,
            profilePicture: true,
          },
        },
      },
    });

    // Emit update
    try {
      this.roomGateway.broadcastSeatUpdate(roomId, seats);
    } catch (e) {
      console.warn('⚠️ Failed to emit seat.update', e);
    }

    return { success: true, result, seats };
  }

  // MUTE SEAT (HOST)
  @Post(':id/seat/:seatIndex/mute')
  @UseGuards(JwtAuthGuard)
  async muteSeat(
    @Param('id') roomId: string,
    @Param('seatIndex') seatIndex: number,
    @Request() req,
  ) {
    const seats = await this.seatsService.muteSeatByHost(
      roomId,
      Number(seatIndex),
      req.user.userId,
    );
    this.roomGateway.broadcastSeatUpdate(roomId, seats);
    return { ok: true, seats };
  }

  // UNMUTE SEAT (HOST)
  @Post(':id/seat/:seatIndex/unmute')
  @UseGuards(JwtAuthGuard)
  async unmuteSeat(
    @Param('id') roomId: string,
    @Param('seatIndex') seatIndex: number,
    @Request() req,
  ) {
    const seats = await this.seatsService.unmuteSeatByHost(
      roomId,
      Number(seatIndex),
      req.user.userId,
    );
    this.roomGateway.broadcastSeatUpdate(roomId, seats);
    return { ok: true, seats };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/seat/mute')
  async hostMuteSeat(
    @Param('id') roomId: string,
    @Body() dto: { seatIndex: number; mute: boolean },
    @Request() req,
  ) {
    const room = await this.roomsService.getRoom(roomId);

    if (room.hostId !== req.user.userId) {
      throw new ForbiddenException('Only host can mute users');
    }

    const { seatIndex, mute } = dto;

    const result = await this.seatsService.hostMuteSeat(
      roomId,
      seatIndex,
      mute,
    );

    // Broadcast to all clients
    this.roomGateway.server.to(`room:${roomId}`).emit('seat.mute', {
      seatIndex,
      mute,
      userId: result.userId,
    });

    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/seat/leave')
  async leaveSeat(@Param('id') id: string, @Request() req) {
    const result = await this.seatsService.leaveSeat(id, req.user.userId);
    return { success: true, data: result };
  }

  // ============================
  // BAN CONTROL (HOST ONLY)
  // ============================
  @Get(':id/kick/all')
  @UseGuards(JwtAuthGuard)
  async getKickList(@Param('id') roomId: string, @Request() req) {
    const room = await this.roomsService.getRoom(roomId);
    if (room.hostId !== req.user.userId)
      throw new ForbiddenException('Only host can view kicked list');

    return this.kickService.getKickList(roomId);
  }

  @Post(':id/kick')
  @UseGuards(JwtAuthGuard)
  async kickUser(
    @Param('id') roomId: string,
    @Body() dto: { userId: string },
    @Request() req,
  ) {
    return this.kickService.kickUser(roomId, dto.userId, req.user.userId);
  }

  @Delete(':id/unkick/:userId')
  @UseGuards(JwtAuthGuard)
  async unkickUser(
    @Param('id') roomId: string,
    @Param('userId') targetId: string,
    @Request() req,
  ) {
    const room = await this.roomsService.getRoom(roomId);
    if (room.hostId !== req.user.userId)
      throw new ForbiddenException('Only host can unkick users');

    return this.kickService.removeKick(roomId, targetId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/ban')
  async banUser(
    @Param('id') id: string,
    @Body() body: { userId: string; reason?: string },
    @Request() req,
  ) {
    const room = await this.roomsService.getRoom(id);

    if (room.hostId !== req.user.userId) {
      throw new ForbiddenException('Only host can ban users');
    }

    const result = await this.roomBanService.banUser(
      id,
      req.user.userId,
      body.userId,
      body.reason,
    );

    return { success: true, data: result };
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/ban/:userId')
  async unbanUser(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Request() req,
  ) {
    const room = await this.roomsService.getRoom(id);

    if (room.hostId !== req.user.userId) {
      throw new ForbiddenException('Only host can unban users');
    }

    const result = await this.roomBanService.unbanUser(
      id,
      req.user.userId,
      userId,
    );
    return { success: true, data: result };
  }

  // ============================
  // RTC
  // ============================

  @UseGuards(JwtAuthGuard)
  @Post(':id/rtc/refresh')
  async refreshToken(@Param('id') id: string) {
    const room = await this.roomsService.getRoom(id);
    const token = await this.rtcService.issueToken(
      room.provider,
      id,
      'publisher',
    );
    return { success: true, token };
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
      throw new ForbiddenException('Only host can disconnect RTC');
    }

    if (body.userId) {
      await this.rtcService.disconnectUser(room.provider, id, body.userId);
    } else {
      await this.rtcService.disconnectRoom(room.provider, id);
    }

    return { success: true };
  }
}
