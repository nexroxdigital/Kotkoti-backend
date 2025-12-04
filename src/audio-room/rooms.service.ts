import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RtcService } from '../rtc/rtc.service';
import { Provider } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RoomsService {
  constructor(
    private prisma: PrismaService,
    private rtc: RtcService,
  ) {}

  async listRooms() {
    return this.prisma.audioRoom.findMany({
      where: { isLive: true },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        hostId: true,
        provider: true,
        isLive: true,
        createdAt: true,
      },
    });
  }

  async getRoomDetail(roomId: string) {
    const room = await this.prisma.audioRoom.findUnique({
      where: { id: roomId },
      include: {
        seats: { orderBy: { index: 'asc' } },
        participants: {
          where: { disconnectedAt: null },
          select: {
            id: true,
            userId: true,
            isHost: true,
            rtcUid: true, 
            muted: true,
            joinedAt: true,
          },
        },
        bans: {
          select: {
            id: true,
            userId: true,
            bannedBy: true,
            reason: true,
            createdAt: true,
          },
        },
      },
    });

    if (!room) throw new NotFoundException('Room not found');

    return room;
  }

  async issuePublisherTokenForUser(roomId: string, userId: string) {
    const room = await this.prisma.audioRoom.findUnique({
      where: { id: roomId },
    });

    if (!room || !room.isLive) {
      throw new NotFoundException('Room not live');
    }

    // user must be on a seat to get a publisher token
    const seat = await this.prisma.seat.findFirst({
      where: { roomId, userId },
    });

    if (!seat) {
      throw new BadRequestException('You must be on a seat to speak');
    }
    const participant = await this.prisma.roomParticipant.findUnique({
      where: { roomId_userId: { roomId, userId } },
    });

    if (!participant?.rtcUid) {
      throw new BadRequestException('RTC UID not found for user');
    }
    const tokenInfo = await this.rtc.issueToken(
      room.provider,
      roomId,
      'publisher',
      Number(participant.rtcUid),
    );

    // Optional: sync rtcUid in roomParticipant
    await this.prisma.roomParticipant.update({
      where: {
        roomId_userId: { roomId, userId },
      },
      data: {
        rtcUid: String(tokenInfo.uid),
        lastActiveAt: new Date(),
      },
    });

    return { token: tokenInfo };
  }

  async updateRtcUid(userId: string, roomId: string, rtcUid: number) {
    return this.prisma.roomParticipant.upsert({
      where: {
        roomId_userId: { roomId, userId },
      },
      create: {
        roomId,
        userId,
        rtcUid: String(rtcUid),
      },
      update: {
        rtcUid: String(rtcUid),
        lastActiveAt: new Date(),
      },
    });
  }

  async createRoom(name: string, hostId: string, provider: Provider) {
    const roomId = uuidv4();
    const room = await this.prisma.audioRoom.create({
      data: {
        id: roomId,
        name,
        hostId,
        provider,
      },
    });

    // Create seats (e.g., 12 seats)
    const seatsData = Array.from({ length: 12 }).map((_, index) => ({
      id: uuidv4(),
      roomId,
      index,
    }));

    await this.prisma.seat.createMany({ data: seatsData });

    // Add host as participant (optional)
    await this.prisma.roomParticipant.create({
      data: {
        roomId,
        userId: hostId,
        isHost: true,
      },
    });

    return room;
  }

  async endRoom(roomId: string, hostId: string) {
    const room = await this.prisma.audioRoom.findUnique({
      where: { id: roomId },
    });
    if (!room) throw new NotFoundException('Room not found');
    if (room.hostId !== hostId)
      throw new BadRequestException('Only host can end');

    await this.prisma.audioRoom.update({
      where: { id: roomId },
      data: { isLive: false, endedAt: new Date() },
    });

    await this.rtc.disconnectRoom(room.provider, roomId);

    return { ok: true };
  }

  async getRoom(roomId: string) {
    const room = await this.prisma.audioRoom.findUnique({
      where: { id: roomId },
      include: { seats: true, participants: true },
    });
    if (!room) throw new NotFoundException('Room not found');
    return room;
  }

  async joinRoom(roomId: string, userId: string) {
    const room = await this.prisma.audioRoom.findUnique({
      where: { id: roomId },
    });
    if (!room || !room.isLive) throw new NotFoundException('Room not live');

    const banned = await this.prisma.audioRoomBan.findUnique({
      where: { roomId_userId: { roomId, userId } },
    });
    if (banned) throw new BadRequestException('You are banned from this room');

    await this.prisma.roomParticipant.upsert({
      where: {
        roomId_userId: { roomId, userId },
      },
      create: {
        roomId,
        userId,
        isHost: room.hostId === userId,
      },
      update: {
        disconnectedAt: null,
        lastActiveAt: new Date(),
        isHost: room.hostId === userId,
      },
    });

    const tokenInfo = await this.rtc.issueToken(
      room.provider,
      roomId,
      'subscriber', // audience
    );

    await this.prisma.roomParticipant.update({
      where: {
        roomId_userId: { roomId, userId },
      },
      data: {
        rtcUid: String(tokenInfo.uid),
      },
    });

    return { room, token: tokenInfo };
  }

  async leaveRoom(roomId: string, userId: string) {
    await this.prisma.roomParticipant.updateMany({
      where: { roomId, userId, disconnectedAt: null },
      data: { disconnectedAt: new Date() },
    });
    return { ok: true };
  }
}
