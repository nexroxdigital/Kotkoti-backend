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
import { RoomGateway } from 'src/gateway/room.gateway';
import { verifyPin } from 'src/common/utils/room-pin.util';
import { ParticipantsService } from 'src/participants/participants.service';

@Injectable()
export class RoomsService {
  constructor(
    private prisma: PrismaService,
    private rtc: RtcService,
    private participant: ParticipantsService,
    private gateway: RoomGateway,
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
      where: {
        isLive: true,

        // 🔥 ONLY rooms with at least one active participant
        participants: {
          some: {
            disconnectedAt: null,
          },
        },
      },

      orderBy: { createdAt: 'desc' },

      select: {
        id: true,
        name: true,
        provider: true,
        isLive: true,
        createdAt: true,
        tag: true,
        imageUrl: true,
        isLocked: true,

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
            index: true,
            userId: true,
            user: {
              select: {
                id: true,
                nickName: true,
                profilePicture: true,
                gender: true,
                dob: true,
                country: true,
                charmLevel: true,
                wealthLevel: true,
                activeItem: {
                  select: {
                    id: true,
                    name: true,
                    icon: true,
                    swf: true,
                  },
                },
              },
            },
          },
        },

        _count: {
          select: {
            // Active users count
            participants: {
              where: { disconnectedAt: null },
            },

            // Occupied seats count
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
                activeItem: {
                  select: {
                    id: true,
                    name: true,
                    icon: true,
                    swf: true,
                  },
                },
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
            role: true,
            rtcUid: true,
            muted: true,
            joinedAt: true,
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
                activeItem: {
                  select: {
                    id: true,
                    name: true,
                    icon: true,
                    swf: true,
                  },
                },
              },
            },
          },
        },

        host: {
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
            activeItem: {
              select: {
                id: true,
                name: true,
                icon: true,
                swf: true,
              },
            },
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

    // const participantsByRole = room.participants.reduce(
    //   (acc, participant) => {
    //     acc[participant.role].push(participant);
    //     return acc;
    //   },
    //   {
    //     HOST: [],
    //     ADMIN: [],
    //     USER: [],
    //   } as Record<'HOST' | 'ADMIN' | 'USER', typeof room.participants>,
    // );

    return room;
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
    tag: string | null;
    announcement?: string | null;
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
        tag: data.tag,
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
        announcement: dto.announcement ?? room.announcement,
        tag: dto.tag ?? room.tag,
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
        seats: {
          orderBy: { index: 'asc' },
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
                activeItems: true,
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
            role: true,
            rtcUid: true,
            muted: true,
            joinedAt: true,
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
                 activeItems: true,
              },
            },
          },
        },

        host: {
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
             activeItems: true,
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

    if (!room) {
      throw new NotFoundException("You don't have an active room");
    }

    return room;
  }

  // async joinRoom(roomId: string, userId: string, pin?: string) {
  //   // --------------------------------------------------
  //   // 1 Ban / kick check
  //   // --------------------------------------------------
  //   const kick = await this.prisma.audioRoomKick.findUnique({
  //     where: { roomId_userId: { roomId, userId } },
  //   });

  //   if (kick) {
  //     if (kick.expiresAt > new Date()) {
  //       const hoursLeft = Math.ceil(
  //         (kick.expiresAt.getTime() - Date.now()) / 3600000,
  //       );
  //       throw new ForbiddenException(
  //         `You are banned from this room for ${hoursLeft} more hours`,
  //       );
  //     }

  //     // expired ban → cleanup
  //     await this.prisma.audioRoomKick.delete({
  //       where: { roomId_userId: { roomId, userId } },
  //     });
  //   }

  //   // --------------------------------------------------
  //   // 2 Load room
  //   // --------------------------------------------------
  //   const room = await this.prisma.audioRoom.findUnique({
  //     where: { id: roomId },
  //     select: {
  //       id: true,
  //       isLive: true,
  //       isLocked: true,
  //       pinHash: true,
  //       provider: true,
  //       hostId: true,
  //       chatMode: true,
  //       host: {
  //         select: {
  //           id: true,
  //           nickName: true,
  //           profilePicture: true,
  //           gender: true,
  //           charmLevel: true,
  //         },
  //       },
  //     },
  //   });

  //   if (!room || !room.isLive) {
  //     throw new NotFoundException('Room not live');
  //   }

  //   // --------------------------------------------------
  //   // 3 PIN check
  //   // --------------------------------------------------
  //   if (room.isLocked) {
  //     if (!pin) {
  //       throw new ForbiddenException('ROOM_PIN_REQUIRED');
  //     }

  //     const ok = await verifyPin(pin, room.pinHash!);
  //     if (!ok) {
  //       throw new ForbiddenException('INVALID_ROOM_PIN');
  //     }
  //   }

  //   // --------------------------------------------------
  //   // 4 Upsert participant (refresh-safe)
  //   // --------------------------------------------------
  //   await this.prisma.roomParticipant.upsert({
  //     where: { roomId_userId: { roomId, userId } },
  //     create: {
  //       roomId,
  //       userId,
  //       isHost: room.hostId === userId,
  //       joinedAt: new Date(),
  //       lastActiveAt: new Date(),
  //     },
  //     update: {
  //       disconnectedAt: null,
  //       lastActiveAt: new Date(),
  //       isHost: room.hostId === userId,
  //     },
  //   });

  //   const participant = await this.prisma.roomParticipant.findUnique({
  //     where: { roomId_userId: { roomId, userId } },
  //   });

  //   if (!participant) {
  //     throw new NotFoundException('Participant missing');
  //   }

  //   // --------------------------------------------------
  //   // 5 Ensure stable rtcUid
  //   // --------------------------------------------------
  //   let rtcUid: number;

  //   if (participant.rtcUid) {
  //     rtcUid = Number(participant.rtcUid);
  //     if (isNaN(rtcUid)) {
  //       rtcUid = Math.floor(Math.random() * 1_000_000_000);
  //     }
  //   } else {
  //     rtcUid = Math.floor(Math.random() * 1_000_000_000);
  //   }

  //   await this.prisma.roomParticipant.update({
  //     where: { roomId_userId: { roomId, userId } },
  //     data: { rtcUid: String(rtcUid) },
  //   });

  //   // --------------------------------------------------
  //   // 6 Issue Agora SUBSCRIBER token only
  //   // --------------------------------------------------
  //   const token = await this.rtc.issueToken(
  //     room.provider,
  //     roomId,
  //     'subscriber',
  //     rtcUid,
  //   );

  //   // --------------------------------------------------
  //   // 7 Load FULL room state for frontend
  //   // --------------------------------------------------
  //   const fullRoom = await this.prisma.audioRoom.findUnique({
  //     where: { id: roomId },
  //     include: {
  //       host: {
  //         select: {
  //           id: true,
  //           nickName: true,
  //           email: true,
  //           phone: true,
  //           profilePicture: true,
  //           coverImage: true,
  //           roleId: true,
  //           dob: true,
  //           bio: true,
  //           gender: true,
  //           country: true,
  //           gold: true,
  //           diamond: true,
  //           isDiamondBlocked: true,
  //           isGoldBlocked: true,
  //           isAccountBlocked: true,
  //           isHost: true,
  //           isReseller: true,
  //           agencyId: true,
  //           vipId: true,
  //           charmLevel: true,
  //           wealthLevel: true,
  //           createdAt: true,
  //           updatedAt: true,
  //           activeItem: {
  //             select: {
  //               id: true,
  //               name: true,
  //               icon: true,
  //               swf: true,
  //             },
  //           },
  //         },
  //       },
  //       seats: {
  //         orderBy: { index: 'asc' },
  //         include: {
  //           user: {
  //             select: {
  //               id: true,
  //               nickName: true,
  //               email: true,
  //               phone: true,
  //               profilePicture: true,
  //               coverImage: true,
  //               roleId: true,
  //               dob: true,
  //               bio: true,
  //               gender: true,
  //               country: true,
  //               gold: true,
  //               diamond: true,
  //               isDiamondBlocked: true,
  //               isGoldBlocked: true,
  //               isAccountBlocked: true,
  //               isHost: true,
  //               isReseller: true,
  //               agencyId: true,
  //               vipId: true,
  //               charmLevel: true,
  //               wealthLevel: true,
  //               createdAt: true,
  //               updatedAt: true,
  //               activeItem: {
  //                 select: {
  //                   id: true,
  //                   name: true,
  //                   icon: true,
  //                   swf: true,
  //                 },
  //               },
  //             },
  //           },
  //         },
  //       },
  //       participants: {
  //         where: { disconnectedAt: null },
  //         select: {
  //           id: true,
  //           userId: true,
  //           isHost: true,
  //           role: true,
  //           rtcUid: true,
  //           muted: true,
  //           joinedAt: true,
  //           user: {
  //             select: {
  //               id: true,
  //               nickName: true,
  //               email: true,
  //               phone: true,
  //               profilePicture: true,
  //               coverImage: true,
  //               roleId: true,
  //               dob: true,
  //               bio: true,
  //               gender: true,
  //               country: true,
  //               gold: true,
  //               diamond: true,
  //               isDiamondBlocked: true,
  //               isGoldBlocked: true,
  //               isAccountBlocked: true,
  //               isHost: true,
  //               isReseller: true,
  //               agencyId: true,
  //               vipId: true,
  //               charmLevel: true,
  //               wealthLevel: true,
  //               createdAt: true,
  //               updatedAt: true,
  //               activeItem: {
  //                 select: {
  //                   id: true,
  //                   name: true,
  //                   icon: true,
  //                   swf: true,
  //                 },
  //               },
  //             },
  //           },
  //         },
  //       },
  //     },
  //   });

  //   if (!fullRoom) {
  //     throw new NotFoundException('Room not found after join');
  //   }
  //   await this.gateway.broadcastParticipants(roomId);

  //   // --------------------------------------------------
  //   // 8 Return payload to frontend
  //   // --------------------------------------------------
  //   return {
  //     room: fullRoom,
  //     token,
  //     rtcUid,
  //   };
  // }

  async joinRoom(roomId: string, userId: string, pin?: string) {
    // --------------------------------------------------
    // 1 Ban / kick check
    // --------------------------------------------------
    const kick = await this.prisma.audioRoomKick.findUnique({
      where: { roomId_userId: { roomId, userId } },
    });

    if (kick) {
      if (kick.expiresAt > new Date()) {
        const hoursLeft = Math.ceil(
          (kick.expiresAt.getTime() - Date.now()) / 3600000,
        );
        throw new ForbiddenException(
          `You are banned from this room for ${hoursLeft} more hours`,
        );
      }

      // expired ban → cleanup
      await this.prisma.audioRoomKick.delete({
        where: { roomId_userId: { roomId, userId } },
      });
    }

    // --------------------------------------------------
    // 2 Load room
    // --------------------------------------------------
    const room = await this.prisma.audioRoom.findUnique({
      where: { id: roomId },
      select: {
        id: true,
        isLive: true,
        isLocked: true,
        pinHash: true,
        provider: true,
        hostId: true,
        chatMode: true,
        host: {
          select: {
            id: true,
            nickName: true,
            profilePicture: true,
            gender: true,
            charmLevel: true,
          },
        },
      },
    });

    if (!room || !room.isLive) {
      throw new NotFoundException('Room not live');
    }

    // --------------------------------------------------
    // 2.5 Single-room guard (already in another room)
    // --------------------------------------------------
    const activeParticipant = await this.prisma.roomParticipant.findFirst({
      where: {
        userId,
        disconnectedAt: null,
        roomId: { not: roomId },
        room: { isLive: true },
      },
      select: { roomId: true },
    });

    if (activeParticipant) {
      throw new ForbiddenException(
        'You are already in another room. Please leave it first.',
      );
    }

    // --------------------------------------------------
    // 3 PIN check
    // --------------------------------------------------
    if (room.isLocked) {
      if (!pin) {
        throw new ForbiddenException('ROOM_PIN_REQUIRED');
      }

      const ok = await verifyPin(pin, room.pinHash!);
      if (!ok) {
        throw new ForbiddenException('INVALID_ROOM_PIN');
      }
    }

    // --------------------------------------------------
    // 4 Upsert participant (refresh-safe)
    // --------------------------------------------------
    await this.prisma.roomParticipant.upsert({
      where: { roomId_userId: { roomId, userId } },
      create: {
        roomId,
        userId,
        isHost: room.hostId === userId,
        joinedAt: new Date(),
        lastActiveAt: new Date(),
      },
      update: {
        disconnectedAt: null,
        lastActiveAt: new Date(),
        isHost: room.hostId === userId,
      },
    });

    const participant = await this.prisma.roomParticipant.findUnique({
      where: { roomId_userId: { roomId, userId } },
    });

    if (!participant) {
      throw new NotFoundException('Participant missing');
    }

    // --------------------------------------------------
    // 5 Ensure stable rtcUid
    // --------------------------------------------------
    let rtcUid: number;

    if (participant.rtcUid && !isNaN(Number(participant.rtcUid))) {
      rtcUid = Number(participant.rtcUid);
    } else {
      rtcUid = Math.floor(Math.random() * 1_000_000_000);
    }

    await this.prisma.roomParticipant.update({
      where: { roomId_userId: { roomId, userId } },
      data: { rtcUid: String(rtcUid) },
    });

    // --------------------------------------------------
    // 6 Issue RTC SUBSCRIBER token
    // --------------------------------------------------
    const token = await this.rtc.issueToken(
      room.provider,
      roomId,
      'subscriber',
      rtcUid,
    );

    // --------------------------------------------------
    // 7 Load FULL room state
    // --------------------------------------------------
    const fullRoom = await this.prisma.audioRoom.findUnique({
      where: { id: roomId },
      include: {
        host: {
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
        seats: {
          orderBy: { index: 'asc' },
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
        },
        participants: {
          where: { disconnectedAt: null },
          select: {
            id: true,
            userId: true,
            isHost: true,
            role: true,
            rtcUid: true,
            muted: true,
            joinedAt: true,
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
        },
      },
    });

    if (!fullRoom) {
      throw new NotFoundException('Room not found after join');
    }

    await this.gateway.broadcastParticipants(roomId);

    // --------------------------------------------------
    // 8 Return payload
    // --------------------------------------------------
    return {
      room: fullRoom,
      token,
      rtcUid,
    };
  }

  async makeAdmin(roomId: string, hostId: string, targetUserId: string) {
    const host = await this.prisma.roomParticipant.findFirst({
      where: { roomId, userId: hostId },
    });

    if (!host) {
      throw new NotFoundException('Host is not a participant in this room');
    }

    if (host.role !== 'HOST') {
      throw new ForbiddenException('Only host can assign admin');
    }

    const targetUser = await this.prisma.roomParticipant.findFirst({
      where: { roomId, userId: targetUserId },
    });

    if (!targetUser) {
      throw new NotFoundException('Target user not found in this room');
    }

    if (targetUser.role === 'HOST') {
      throw new ForbiddenException('Cannot change host role');
    }

    if (targetUser.role === 'ADMIN') {
      throw new ForbiddenException('Target user is already an admin');
    }

    await this.prisma.roomParticipant.update({
      where: { roomId_userId: { roomId, userId: targetUserId } },
      data: { role: 'ADMIN' },
    });

    return {
      status: 'success',
      message: 'User has been successfully promoted to admin',
    };
  }

  async removeAdmin(roomId: string, actorId: string, targetUserId: string) {
    //  Check actor
    const host = await this.participant.getParticipant(roomId, actorId);

    if (!host) {
      throw new NotFoundException('Host is not a participant in this room');
    }

    if (host.role !== 'HOST') {
      throw new ForbiddenException('Only host can remove admin');
    }

    // Check target user
    const targetUser = await this.prisma.roomParticipant.findFirst({
      where: {
        roomId,
        userId: targetUserId,
      },
    });

    if (!targetUser) {
      throw new NotFoundException('Target user not found in this room');
    }

    if (targetUser.role === 'HOST') {
      throw new ForbiddenException('Cannot remove admin role from host');
    }

    // Optional: idempotent behavior
    if (targetUser.role === 'USER') {
      return {
        status: 'success',
        message: 'User is already a regular member',
      };
    }

    // Remove admin
    await this.prisma.roomParticipant.update({
      where: {
        roomId_userId: {
          roomId,
          userId: targetUserId,
        },
      },
      data: {
        role: 'USER',
      },
    });

    return {
      status: 'success',
      message: 'Admin role removed successfully',
    };
  }

  async leaveRoom(roomId: string, userId: string) {
    // 1 Clear seat if user was seated
    await this.prisma.seat.updateMany({
      where: { roomId, userId },
      data: {
        userId: null,
        micOn: true,
      },
    });

    // 2 Mark participant disconnected
    await this.prisma.roomParticipant.updateMany({
      where: { roomId, userId },
      data: { disconnectedAt: new Date() },
    });

    // 3 FETCH UPDATED SEATS
    const seats = await this.prisma.seat.findMany({
      where: { roomId },
      orderBy: { index: 'asc' },
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
            activeItem: {
              select: {
                id: true,
                name: true,
                icon: true,
                swf: true,
              },
            },
          },
        },
      },
    });

    // 4 BROADCAST SEAT UPDATE (THIS WAS MISSING)
    this.gateway.broadcastSeatUpdate(roomId, seats);

    // 5 BROADCAST PARTICIPANTS
    await this.gateway.broadcastParticipants(roomId);

    return { ok: true };
  }
}
