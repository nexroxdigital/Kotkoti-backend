import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RtcService } from '../rtc/rtc.service';
import { Provider } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { join } from 'path';
import * as fs from 'fs';
import sharp from 'sharp';
import { UpdateRoomDto } from './dto/UpdateRoomDto';

@Injectable()
export class RoomsService {
  constructor(
    private prisma: PrismaService,
    private rtc: RtcService,
  ) {}
  // Dynamically adjust seat count (increase / decrease seats)
  private async adjustSeatCount(roomId: string, newCount: number) {
    const currentSeats = await this.prisma.seat.findMany({
      where: { roomId },
      orderBy: { index: 'asc' },
    });

    const currentCount = currentSeats.length;

    // === If same seat count, nothing to change ===
    if (currentCount === newCount) return;

    // === If new seat count is greater → ADD new seats ===
    if (newCount > currentCount) {
      const seatsToAdd = newCount - currentCount;
      const newSeats = Array.from({ length: seatsToAdd }).map((_, i) => ({
        roomId,
        index: currentCount + i,
      }));

      await this.prisma.seat.createMany({ data: newSeats });
      return;
    }

    // === If new seat count is smaller → REMOVE extra seats ===
    // Only remove seats that are EMPTY. If occupied, throw error.
    const seatsToRemove = currentSeats.slice(newCount); // seats beyond newCount

    const occupied = seatsToRemove.some((s) => s.userId !== null);
    if (occupied) {
      throw new Error('Cannot reduce seat count: some seats are occupied');
    }

    await this.prisma.seat.deleteMany({
      where: { id: { in: seatsToRemove.map((s) => s.id) } },
    });
  }

  async listRooms() {
    return this.prisma.audioRoom.findMany({
      where: { isLive: true },
      orderBy: { createdAt: 'desc' },

      select: {
        id: true,
        name: true,
        provider: true,
        isLive: true,
        createdAt: true,
        tags: true,
        imageUrl: true,

        host: {
          select: {
            id: true,
            nickName: true,
            profilePicture: true,
            gender: true,
            email: true,
            dob: true,
            country: true,
            charmLevel: true,
            charmLevelId: true,
          },
        },

        seats: {
          where: { userId: { not: null } },
          orderBy: { index: 'asc' },
          select: {
            // ... seat fields
            index: true,
            userId: true,
            user: {
              select: {
                id: true,
                nickName: true,
                profilePicture: true,
                gender: true,
                email: true,
                dob: true,
                country: true,
                charmLevel: true,
                charmLevelId: true,
              },
            },
          },
        },

        _count: {
          select: {
            // 1. Count Active Participants
            participants: {
              where: { disconnectedAt: null },
            },

            // 2. Count Occupied Seats (MUST BE ADDED HERE)
            seats: {
              where: { userId: { not: null } },
            },
          },
        },
      },
    });
  }

  async getRoomDetail(roomId: string) {
    const room = await this.prisma.audioRoom.findUnique({
      where: { id: roomId },
      include: {
        seats: {
          orderBy: { index: 'asc' },
          include: {
            user: {
              select: {
                id: true,
                nickName: true,
                profilePicture: true,
                gender: true,
                email: true,
                dob: true,
                country: true,
                charmLevel: true,
                charmLevelId: true,
              },
            },
          },
        },

        participants: {
          where: { disconnectedAt: null },
          select: {
            id: true,
            userId: true,
            isHost: true,
            rtcUid: true,
            muted: true,
            joinedAt: true,
            user: {
              select: {
                id: true,
                nickName: true,
                profilePicture: true,
                gender: true,
                email: true,
                dob: true,
                country: true,
                charmLevel: true,
                charmLevelId: true,
              },
            },
          },
        },

        host: {
          select: {
            id: true,
            nickName: true,
            profilePicture: true,
            gender: true,
            email: true,
            dob: true,
            country: true,
            charmLevel: true,
            charmLevelId: true,
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

        _count: {
          select: {
            // Count Active Participants
            participants: {
              where: { disconnectedAt: null },
            },

            // Count Occupied Seats (MUST BE ADDED HERE)
            seats: {
              where: { userId: { not: null } },
            },
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

  // ---------------------------------------------------------
  // CREATE ROOM
  // ---------------------------------------------------------
  async createRoom(data: {
    name: string;
    tags: string[];
    seatCount: number;
    imageUrl?: string | null;
    hostId: string;
  }) {
    // Prevent creating more than one room
    const exists = await this.prisma.audioRoom.findFirst({
      where: { hostId: data.hostId, isLive: true },
    });

    if (exists) {
      throw new BadRequestException('You already have a live audio room');
    }
    const seatCount = Math.max(1, Number(data.seatCount));

    const room = await this.prisma.audioRoom.create({
      data: {
        id: uuidv4(),
        name: data.name,
        tags: data.tags,
        hostId: data.hostId,
        imageUrl: data.imageUrl,
      },
    });

    // Create seats
    const seats = Array.from({ length: seatCount }).map((_, index) => ({
      id: uuidv4(),
      roomId: room.id,
      index,
    }));

    await this.prisma.seat.createMany({ data: seats });

    // Add host as participant
    await this.prisma.roomParticipant.create({
      data: {
        roomId: room.id,
        userId: data.hostId,
        isHost: true,
      },
    });

    return room;
  }

  // ---------------------------------------------------------
  // PROCESS IMAGE
  // ---------------------------------------------------------
  async processRoomImage(roomId: string, file: Express.Multer.File) {
    const tempPath = file.path;

    const outputDir = join(process.cwd(), 'uploads/rooms');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const finalFile = `${roomId}-${Date.now()}.webp`;
    const finalPath = join(outputDir, finalFile);

    // resize/convert to webp
    await sharp(tempPath)
      .resize(600, 600, { fit: 'cover' })
      .webp({ quality: 80 })
      .toFile(finalPath);

    fs.unlinkSync(tempPath);

    return `/uploads/rooms/${finalFile}`;
  }

  // ---------------------------------------------------------
  // UPDATE ROOM IMAGE
  // ---------------------------------------------------------
  async updateRoomImage(roomId: string, imageUrl: string) {
    await this.prisma.audioRoom.update({
      where: { id: roomId },
      data: { imageUrl },
    });
  }

  async updateRoom(
    roomId: string,
    userId: string,
    dto: UpdateRoomDto,
    file?: Express.Multer.File,
  ) {
    const room = await this.prisma.audioRoom.findUnique({
      where: { id: roomId },
    });
    if (!room) throw new NotFoundException('Room not found');

    if (room.hostId !== userId) {
      throw new ForbiddenException('Only host can edit the room');
    }

    let imageUrl = room.imageUrl;

    if (file) {
      imageUrl = await this.processRoomImage(roomId, file);
    }

    // Update core room data
    const updated = await this.prisma.audioRoom.update({
      where: { id: roomId },
      data: {
        name: dto.name ?? room.name,
        tags: dto.tags ?? room.tags,
        seatCount: dto.seatCount ?? room.seatCount,
        imageUrl,
      },
    });

    // If seatCount changed → adjust seat rows
    if (dto.seatCount && dto.seatCount !== room.seatCount) {
      await this.adjustSeatCount(roomId, dto.seatCount);
    }

    return updated;
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

  async getRoomByHost(hostId: string) {
    const room = await this.prisma.audioRoom.findFirst({
      where: { hostId, isLive: true },
      include: {
        host: {
          select: {
            id: true,
            nickName: true,
            profilePicture: true,
            gender: true,
            email: true,
            dob: true,
            country: true,
            charmLevel: true,
            charmLevelId: true,
          },
        },
        seats: {
          orderBy: { index: 'asc' },
          include: {
            user: {
              select: {
                id: true,
                nickName: true,
                profilePicture: true,
                gender: true,
                email: true,
                dob: true,
                country: true,
                charmLevel: true,
                charmLevelId: true,
              },
            },
          },
        },
        participants: {
          where: { disconnectedAt: null },
          select: {
            id: true,
            userId: true,
            isHost: true,
            rtcUid: true,
            muted: true,
            joinedAt: true,
            user: {
              select: {
                id: true,
                nickName: true,
                profilePicture: true,
                gender: true,
                email: true,
                dob: true,
                country: true,
                charmLevel: true,
                charmLevelId: true,
              },
            },
          },
        },
        _count: {
          select: {
            // Count Active Participants
            participants: {
              where: { disconnectedAt: null },
            },

            // Count Occupied Seats (MUST BE ADDED HERE)
            seats: {
              where: { userId: { not: null } },
            },
          },
        },
      },
    });

    if (!room) {
      throw new NotFoundException("You don't have an active room");
    }

    return room;
  }

  async joinRoom(roomId: string, userId: string) {
    // ===========================
    // 1. CHECK 24-HOUR KICK BAN
    // ===========================
    const kick = await this.prisma.audioRoomKick.findUnique({
      where: { roomId_userId: { roomId, userId } },
    });

    if (kick) {
      if (kick.expiresAt > new Date()) {
        const hours = Math.ceil(
          (kick.expiresAt.getTime() - Date.now()) / 3600000,
        );
        throw new ForbiddenException(
          `You are banned from this room for ${hours} more hours`,
        );
      }

      // Remove expired kick ban
      await this.prisma.audioRoomKick.delete({
        where: { roomId_userId: { roomId, userId } },
      });
    }

    // ===========================
    // 2. VERIFY ROOM STATUS
    // ===========================
    const room = await this.prisma.audioRoom.findUnique({
      where: { id: roomId },
      include: {
        host: {
          select: {
            id: true,
            nickName: true,
            profilePicture: true,
            gender: true,
            email: true,
            dob: true,
            country: true,
            charmLevel: true,
            charmLevelId: true,
          },
        },
      },
    });

    if (!room || !room.isLive) {
      throw new NotFoundException('Room not live');
    }

    // ===========================
    // 3. UPSERT PARTICIPANT
    // ===========================
    await this.prisma.roomParticipant.upsert({
      where: { roomId_userId: { roomId, userId } },
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

    // ===========================
    // 4. ISSUE SUBSCRIBER TOKEN
    // ===========================
    const tokenInfo = await this.rtc.issueToken(
      room.provider,
      roomId,
      'subscriber',
    );

    // ===========================
    // 5. SAVE RTC UID
    // ===========================
    await this.prisma.roomParticipant.update({
      where: { roomId_userId: { roomId, userId } },
      data: { rtcUid: String(tokenInfo.uid) },
    });

    // ===========================
    // 6. RETURN ROOM INFO
    // ===========================
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
