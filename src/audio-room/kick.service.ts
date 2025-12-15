import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SeatsService } from '../seats/seats.service';
import { ParticipantsService } from '../participants/participants.service';
import { RoomGateway } from '../gateway/room.gateway';

@Injectable()
export class KickService {
  constructor(
    private prisma: PrismaService,
    private seatsService: SeatsService,
    private participantsService: ParticipantsService,
    private roomGateway: RoomGateway,
  ) {}


    // Get all kicked users (host panel)
  async getKickList(roomId: string) {
    return this.prisma.audioRoomKick.findMany({
      where: { roomId },
      include: {
        user: { select: { id: true, nickName: true, email: true, profilePicture: true, charmLevel: true , wealthLevel: true, dob: true, country: true, gender: true} },
      },
      orderBy: { expiresAt: 'desc' },
    });
  }

  async kickUser(roomId: string, userId: string, hostId: string) {
    // Fetch room
    const room = await this.prisma.audioRoom.findUnique({
      where: { id: roomId },
    });
    if (!room) throw new NotFoundException('Room not found');

    // Only host can kick
    if (room.hostId !== hostId) {
      throw new ForbiddenException('Only host can kick users');
    }

    // Ban for 24 hours
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.prisma.audioRoomKick.upsert({
      where: { roomId_userId: { roomId, userId } },
      create: {
        roomId,
        userId,
        bannedBy: hostId,
        expiresAt,
      },
      update: { expiresAt },
    });

    // Remove user from seat silently
    const seatResult = await this.seatsService.leaveSeatSilent(roomId, userId);

    // Remove participant from active list
    await this.participantsService.remove(roomId, userId);

    // Broadcast updated seats
    if (seatResult?.seats) {
      this.roomGateway.server.to(`room:${roomId}`).emit('seat.update', {
        seats: seatResult.seats,
      });
    }
    // Tell everyone that user was kicked
    this.roomGateway.server.to(`room:${roomId}`).emit('user.kicked', {
      userId,
    });

    // Emit list-change event to host UI
this.roomGateway.server.to(`room:${roomId}`).emit("kick.list.update", {});

    return { success: true };
  }

  // 📌 Remove kick (unban)
  async removeKick(roomId: string, targetId: string) {
    const exists = await this.prisma.audioRoomKick.findUnique({
      where: { roomId_userId: { roomId, userId: targetId } },
    });
    if (!exists) throw new NotFoundException('User not kicked');

    await this.prisma.audioRoomKick.delete({
      where: { roomId_userId: { roomId, userId: targetId } },
    });

    return { success: true };
  }

  // 📌 Check kick while joining
  async checkBan(roomId: string, userId: string) {
    const kicked = await this.prisma.audioRoomKick.findUnique({
      where: { roomId_userId: { roomId, userId } },
    });

    if (!kicked) return null;

    if (kicked.expiresAt > new Date()) {
      return kicked;
    }

    // remove expired ban
    await this.prisma.audioRoomKick.delete({
      where: { roomId_userId: { roomId, userId } },
    });

    return null;
  }
}
