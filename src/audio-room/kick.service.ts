import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
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

  async kickUser(roomId: string, targetUserId: string, hostId: string) {
    console.log("hellooooooooooo",roomId,targetUserId,hostId)
    // Validate room
    const room = await this.prisma.audioRoom.findUnique({
      where: { id: roomId },
    });

    if (!room) throw new NotFoundException('Room not found');
    if (room.hostId !== hostId)
      throw new ForbiddenException('Only host can kick users');

    // 24hr ban
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Ban user or extend ban
    await this.prisma.audioRoomKick.upsert({
      where: { roomId_userId: { roomId, userId: targetUserId } },
      create: {
        roomId,
        userId: targetUserId,
        bannedBy: hostId,
        expiresAt,
      },
      update: { expiresAt },
    });

    // Remove seat silently
    const seatResult = await this.seatsService.leaveSeatSilent(roomId, targetUserId);

    // Remove participant (socket presence)
    await this.participantsService.remove(roomId, targetUserId);

    // Broadcast seat updates
    if (seatResult?.seats) {
      this.roomGateway.broadcastSeatUpdate(roomId, seatResult.seats);
    }

    // Notify clients
    this.roomGateway.server.to(`room:${roomId}`).emit('user.kicked', {
      userId: targetUserId,
    });

    return { success: true };
  }
}
