import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ParticipantsService {
  constructor(private prisma: PrismaService) {}

  async add(roomId: string, userId: string, rtcUid?: string, isHost = false) {
    return this.prisma.roomParticipant.upsert({
      where: {
        roomId_userId: { roomId, userId }, // uses @@unique
      },
      create: {
        roomId,
        userId,
        rtcUid: rtcUid || null,
        isHost,
      },
      update: {
        rtcUid: rtcUid || null,
        lastActiveAt: new Date(),
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
    const participants = await this.prisma.roomParticipant.findMany({
      where: {
        roomId,
        disconnectedAt: null,
      },
      include: {
        user: {
          select: {
            id: true,
            nickName: true,
            email: true,
            phone: true,
            profilePicture: true,
            coverImage: true,
            roleId: true,
            dob: true,
            bio: true,
            gender: true,
            country: true,
            gold: true,
            diamond: true,
            isDiamondBlocked: true,
            isGoldBlocked: true,
            isAccountBlocked: true,
            isHost: true,
            isReseller: true,
            agencyId: true,
            vipId: true,
            charmLevel: true,
            wealthLevel: true,
            createdAt: true,
            updatedAt: true,
            activeItem: true,
          },
        },
      },
    });

    // const grouped = participants.reduce(  
    //   (acc, participant) => {
    //     acc[participant.role].push(participant);
    //     return acc;
    //   },
    //   {
    //     HOST: [],
    //     ADMIN: [],
    //     USER: [],
    //   } as Record<'HOST' | 'ADMIN' | 'USER', typeof participants>,
    // );

    return participants;
  }

  async getRoomWithHost(roomId: string) {
    const room = await this.prisma.audioRoom.findUnique({
      where: { id: roomId },
      select: { hostId: true },
    });

    if (!room) throw new Error('Room not found');

    return room;
  }

  async getParticipant(roomId: string, userId: string) {
    const participant = await this.prisma.roomParticipant.findUnique({
      where: {
        roomId_userId: {
          roomId,
          userId,
        },
      },
    });

    if (!participant) {
      throw new ForbiddenException('User is not in this room');
    }

    return participant;
  }

  async ensureParticipant(roomId: string, userId: string) {
    const exists = await this.prisma.roomParticipant.findFirst({
      where: { roomId, userId },
    });

    if (!exists) {
      await this.prisma.roomParticipant.create({
        data: {
          roomId,
          userId,
          isHost: false,
        },
      });
    }
  }
}
