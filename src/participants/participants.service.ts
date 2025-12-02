import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ParticipantsService {
  constructor(private prisma: PrismaService) {}

  async add(roomId: string, userId: string, rtcUid?: string, isHost = false) {
    return this.prisma.roomParticipant.create({
      data: {
        roomId,
        userId,
        rtcUid: rtcUid || null,
        isHost,
      },
    });
  }

  async remove(roomId: string, userId: string) {
    await this.prisma.roomParticipant.updateMany({
      where: { roomId, userId, disconnectedAt: null },
      data: { disconnectedAt: new Date() },
    });
  }

  async markActive(roomId: string, userId: string) {
    await this.prisma.roomParticipant.updateMany({
      where: { roomId, userId },
      data: { lastActiveAt: new Date() },
    });
  }

  async getActive(roomId: string) {
    return this.prisma.roomParticipant.findMany({
      where: { roomId, disconnectedAt: null },
    });
  }
}
