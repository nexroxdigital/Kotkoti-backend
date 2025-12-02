import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RoomBanService {
  constructor(private prisma: PrismaService) {}

  async banUser(
    roomId: string,
    hostId: string,
    targetUserId: string,
    reason?: string,
  ) {
    const room = await this.prisma.audioRoom.findUnique({ where: { id: roomId } });
    if (!room) throw new NotFoundException('Room not found');
    if (room.hostId !== hostId)
      throw new ForbiddenException('Only host can ban users');

    // create or update ban
    const ban = await this.prisma.audioRoomBan.upsert({
      where: { roomId_userId: { roomId, userId: targetUserId } },
      update: { reason },
      create: {
        roomId,
        userId: targetUserId,
        bannedBy: hostId,
        reason,
      },
    });

    // kick from room
    await this.prisma.roomParticipant.updateMany({
      where: { roomId, userId: targetUserId, disconnectedAt: null },
      data: { disconnectedAt: new Date() },
    });

    // remove from seats
    await this.prisma.seat.updateMany({
      where: { roomId, userId: targetUserId },
      data: { userId: null, micOn: true },
    });

    return ban;
  }

  async unbanUser(roomId: string, hostId: string, targetUserId: string) {
    const room = await this.prisma.audioRoom.findUnique({ where: { id: roomId } });
    if (!room) throw new NotFoundException('Room not found');
    if (room.hostId !== hostId)
      throw new ForbiddenException('Only host can unban');

    await this.prisma.audioRoomBan.deleteMany({
      where: { roomId, userId: targetUserId },
    });

    return { ok: true };
  }

  async isBanned(roomId: string, userId: string) {
    return this.prisma.audioRoomBan.findUnique({
      where: { roomId_userId: { roomId, userId } },
    });
  }
}
