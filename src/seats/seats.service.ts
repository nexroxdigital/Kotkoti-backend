import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SeatsRepository } from './seats.repository';
import { v4 as uuidv4 } from 'uuid';
import { Seat, SeatMode } from '@prisma/client';
import { RoomGateway } from 'src/gateway/room.gateway';

@Injectable()
export class SeatsService {
  constructor(
    private prisma: PrismaService,
    private seatsRepo: SeatsRepository,
  ) {}

  async changeSeatMode(
    roomId: string,
    hostId: string,
    seatIndex: number,
    mode: SeatMode,
  ) {
    const room = await this.prisma.audioRoom.findUnique({
      where: { id: roomId },
    });
    if (!room) throw new NotFoundException('Room not found');
    if (room.hostId !== hostId)
      throw new BadRequestException('Only host can change seat mode');

    const seat = await this.seatsRepo.findSeatByRoomAndIndex(roomId, seatIndex);
    if (!seat) throw new NotFoundException('Seat not found');

    await this.prisma.seat.update({
      where: { id: seat.id },
      data: { mode },
    });

    const seats = await this.prisma.seat.findMany({
      where: { roomId },
      orderBy: { index: 'asc' },
    });

    // Send update to all users
    //this.roomGateway.broadcastSeatUpdate(roomId, seats);

    return seats;
  }

  async bulkToggleFreeRequest(
    roomId: string,
    userId: string,
    mode: 'FREE' | 'REQUEST',
  ) {
    const room = await this.prisma.audioRoom.findUnique({
      where: { id: roomId },
    });

    if (!room) throw new NotFoundException('Room not found');
    if (room.hostId !== userId)
      throw new ForbiddenException('Only host can update');

    // Determine which seats to update
    const targetMode = mode === 'REQUEST' ? 'FREE' : 'REQUEST';

    await this.prisma.seat.updateMany({
      where: {
        roomId,
        mode: targetMode, // convert opposite mode
      },
      data: {
        mode,
      },
    });

    // Fetch updated seats with user data
    const updatedSeats = await this.prisma.seat.findMany({
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

    return updatedSeats;
  }

  async changeSeatCount(roomId: string, userId: string, seatCount: number) {
    const room = await this.prisma.audioRoom.findUnique({
      where: { id: roomId },
    });
    if (!room) throw new NotFoundException('Room not found');
    if (room.hostId !== userId)
      throw new ForbiddenException('Only host can update seat count');

    const existing = await this.prisma.seat.findMany({
      where: { roomId },
      orderBy: { index: 'asc' },
    });

    const oldCount = existing.length;

    // 1 INCREASE SEATS
    if (seatCount > oldCount) {
      const newSeats = Array.from({ length: seatCount - oldCount }).map(
        (_, i) => ({
          roomId,
          index: oldCount + i,
          micOn: true,
          mode: SeatMode.FREE,
        }),
      );

      await this.prisma.seat.createMany({ data: newSeats });
    }

    // 2 DECREASE SEATS → AUTO REMOVE USERS (NO RTC LOGIC)
    if (seatCount < oldCount) {
      const seatsToRemove = existing.filter((s) => s.index >= seatCount);

      for (const seat of seatsToRemove) {
        if (seat.userId) {
          // Just remove user from seat
          await this.prisma.seat.update({
            where: { id: seat.id },
            data: { userId: null, micOn: true },
          });
        }
      }

      await this.prisma.seat.deleteMany({
        where: { roomId, index: { gte: seatCount } },
      });
    }

    // 3 UPDATE ROOM SEAT COUNT
    await this.prisma.audioRoom.update({
      where: { id: roomId },
      data: { seatCount },
    });

    // 4 RETURN UPDATED SEATS
    const updatedSeats = await this.prisma.seat.findMany({
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

    return { seats: updatedSeats };
  }

  async requestSeat(roomId: string, userId: string, seatIndex?: number) {
    const seat = await this.prisma.seat.findFirst({
      where: { roomId, index: seatIndex },
    });

    if (!seat) throw new NotFoundException('Seat not found');

    // Cannot request LOCKED seat
    if (seat.mode === 'LOCKED') {
      throw new BadRequestException('This seat is locked');
    }

    // FREE seat → INSTANT JOIN (NO REQUEST)
    if (seat.mode === 'FREE') {
      return this.takeSeat(roomId, seatIndex!, userId);
    }

    // REQUEST seat → create approval request
    return this.prisma.seatRequest.create({
      data: {
        id: uuidv4(),
        roomId,
        userId,
        seatIndex: seatIndex ?? null,
        status: 'PENDING',
      },
    });
  }

  // --------------------------
  // HOST TAKES SEAT (NO REQUEST)
  // --------------------------
  async hostTakeSeat(roomId: string, hostId: string, seatIndex: number) {
    const room = await this.prisma.audioRoom.findUnique({
      where: { id: roomId },
    });
    if (!room) throw new NotFoundException('Room not found');
    if (room.hostId !== hostId)
      throw new BadRequestException('Only host can call this');

    const seat = await this.prisma.seat.findFirst({
      where: { roomId, index: seatIndex },
    });
    if (!seat) throw new NotFoundException('Seat not found');

    // Remove host from any seat
    await this.prisma.seat.updateMany({
      where: { roomId, userId: hostId },
      data: { userId: null, micOn: false },
    });

    // Assign new seat (mic OFF)
    await this.prisma.seat.update({
      where: { id: seat.id },
      data: { userId: hostId, micOn: false },
    });

    const seats = await this.prisma.seat.findMany({
      where: { roomId },
      orderBy: { index: 'asc' },
    });
    return seats;
  }

  // async hostTakeSeat(roomId: string, hostId: string, seatIndex: number) {
  //   const room = await this.prisma.audioRoom.findUnique({
  //     where: { id: roomId },
  //   });
  //   if (!room) throw new NotFoundException('Room not found');

  //   if (room.hostId !== hostId) {
  //     throw new BadRequestException('Only host can call this');
  //   }

  //   const seat = await this.prisma.seat.findFirst({
  //     where: { roomId, index: seatIndex },
  //   });

  //   if (!seat) throw new NotFoundException('Seat not found');
  //   if (seat.mode === 'LOCKED') throw new BadRequestException('Seat is locked');

  //   // Remove host from existing seat (only one seat per user)
  //   await this.prisma.seat.updateMany({
  //     where: { roomId, userId: hostId },
  //     data: { userId: null, micOn: true },
  //   });

  //   // Assign seat to host
  //   await this.prisma.seat.update({
  //     where: { id: seat.id },
  //     data: { userId: hostId, micOn: true },
  //   });

  //   // Return updated seats
  //   const seats = await this.prisma.seat.findMany({
  //     where: { roomId },
  //     orderBy: { index: 'asc' },
  //   });

  //   return seats;
  // }

  async takeSeat(roomId: string, seatIndex: number, userId: string) {
    const room = await this.prisma.audioRoom.findUnique({
      where: { id: roomId },
    });
    if (!room) throw new NotFoundException('Room not found');

    const seat = await this.prisma.seat.findFirst({
      where: { roomId, index: seatIndex },
    });
    if (!seat) throw new NotFoundException('Seat not found');

    const isHost = room.hostId === userId;
    if (seat.userId) throw new BadRequestException('Seat occupied');
    // RULE: HOST may take any seat
    // USER may take only FREE seats
    if (!isHost && seat.mode !== 'FREE') {
      throw new BadRequestException('Seat is not free');
    }

    // Remove existing seat of this user
    await this.prisma.seat.updateMany({
      where: { roomId, userId },
      data: { userId: null },
    });

    // Assign new seat
    await this.prisma.seat.update({
      where: { id: seat.id },
      data: { userId },
    });

    // ✅ RETURN FULLY POPULATED SEAT DATA
    const updatedSeats = await this.prisma.seat.findMany({
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

    return updatedSeats;
  }

  async approveSeatRequest(requestId: string, hostId: string, accept: boolean) {
    const req = await this.prisma.seatRequest.findUnique({
      where: { id: requestId },
    });
    if (!req) throw new NotFoundException('Seat request not found');

    const room = await this.prisma.audioRoom.findUnique({
      where: { id: req.roomId },
    });
    if (!room) throw new NotFoundException('Room not found');

    if (room.hostId !== hostId)
      throw new BadRequestException('Only host can approve');

    // Host denied
    if (!accept) {
      await this.prisma.seatRequest.update({
        where: { id: requestId },
        data: { status: 'DENIED' },
      });
      return { ok: true };
    }

    // ======================================
    // 🔍 CHOOSE TARGET SEAT
    // ======================================
    let seat: Seat | null;
    if (req.seatIndex != null) {
      seat = await this.prisma.seat.findFirst({
        where: {
          roomId: req.roomId,
          index: req.seatIndex,
          mode: { in: ['FREE', 'REQUEST'] }, // 🔥 new logic
        },
      });
    } else {
      seat = await this.prisma.seat.findFirst({
        where: {
          roomId: req.roomId,
          userId: null,
          mode: { in: ['FREE', 'REQUEST'] }, // 🔥 new logic
        },
      });
    }

    if (!seat) throw new BadRequestException('No free seat or seat is locked');

    if (!seat) throw new BadRequestException('No free seat or seat is locked');

    // ======================================
    // 🧹 REMOVE USER FROM ANY EXISTING SEAT
    // ======================================
    await this.prisma.seat.updateMany({
      where: { roomId: req.roomId, userId: req.userId },
      data: { userId: null, micOn: false },
    });

    // ======================================
    // 🪑 ASSIGN NEW SEAT
    // ======================================
    await this.prisma.seat.update({
      where: { id: seat.id },
      data: { userId: req.userId, micOn: false },
    });

    // Mark request resolved
    await this.prisma.seatRequest.update({
      where: { id: requestId },
      data: { status: 'ACCEPTED' },
    });

    const updatedSeats = await this.prisma.seat.findMany({
      where: { roomId: req.roomId },
      orderBy: { index: 'asc' },
    });

    return {
      ok: true,
      seatIndex: seat.index,
      seats: updatedSeats,
    };
  }

  async leaveSeat(roomId: string, userId: string) {
    const seat = await this.prisma.seat.findFirst({
      where: { roomId, userId },
    });

    if (seat) {
      await this.prisma.seat.update({
        where: { id: seat.id },
        data: { userId: null, micOn: true },
      });
    }

    const seats = await this.prisma.seat.findMany({
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

    return { seats };
  }

  async leaveSeatSilent(roomId: string, userId: string) {
    const seat = await this.prisma.seat.findFirst({
      where: { roomId, userId },
    });

    if (!seat) return null;

    await this.prisma.seat.update({
      where: { id: seat.id },
      data: {
        userId: null,
        micOn: true,
      },
    });

    const seats = await this.prisma.seat.findMany({
      where: { roomId },
      orderBy: { index: 'asc' },
    });

    return { ok: true, seats };
  }

  // seats.service.ts
  async removeUserFromSeat(
    roomId: string,
    hostId: string,
    targetUserId: string,
  ) {
    // 1. Verify room & host
    const room = await this.prisma.audioRoom.findUnique({
      where: { id: roomId },
    });

    if (!room) throw new NotFoundException('Room not found');
    if (room.hostId !== hostId)
      throw new ForbiddenException('Only host can remove users from seat');

    // 2. Find user's seat
    const seat = await this.prisma.seat.findFirst({
      where: { roomId, userId: targetUserId },
    });

    if (!seat) return null;

    // 3. Remove user from seat
    await this.prisma.seat.update({
      where: { id: seat.id },
      data: {
        userId: null,
        micOn: true,
      },
    });

    // 4. Return updated seats
    const seats = await this.prisma.seat.findMany({
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

    return seats;
  }

  async toggleMic(roomId: string, userId: string, micOn: boolean) {
    const seat = await this.prisma.seat.findFirst({
      where: { roomId, userId },
    });
    if (!seat) throw new NotFoundException('User not on seat');
    await this.prisma.seat.update({
      where: { id: seat.id },
      data: { micOn },
    });
    return { ok: true };
  }

  // --- mute a seat (host)
  async muteSeatByHost(roomId: string, seatIndex: number, hostId: string) {
    const room = await this.prisma.audioRoom.findUnique({
      where: { id: roomId },
    });
    if (!room) throw new NotFoundException('Room not found');
    if (room.hostId !== hostId)
      throw new BadRequestException('Only host can mute seats');

    const seat = await this.prisma.seat.findFirst({
      where: { roomId, index: seatIndex },
    });
    if (!seat) throw new NotFoundException('Seat not found');

    await this.prisma.seat.update({
      where: { id: seat.id },
      data: { micOn: false }, // seat muted
    });

    const seats = await this.prisma.seat.findMany({
      where: { roomId },
      orderBy: { index: 'asc' },
    });

    // broadcast updated seats
    // this.roomGateway.broadcastSeatUpdate(roomId, seats);

    return seats;
  }

  // --- unmute seat (host)
  async unmuteSeatByHost(roomId: string, seatIndex: number, hostId: string) {
    const room = await this.prisma.audioRoom.findUnique({
      where: { id: roomId },
    });
    if (!room) throw new NotFoundException('Room not found');
    if (room.hostId !== hostId)
      throw new BadRequestException('Only host can unmute seats');

    const seat = await this.prisma.seat.findFirst({
      where: { roomId, index: seatIndex },
    });
    if (!seat) throw new NotFoundException('Seat not found');

    await this.prisma.seat.update({
      where: { id: seat.id },
      data: { micOn: true }, // seat unmuted (allowed)
    });

    const seats = await this.prisma.seat.findMany({
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

    return seats;
  }

  async hostMuteSeat(roomId: string, seatIndex: number, mute: boolean) {
    const seat = await this.prisma.seat.findFirst({
      where: { roomId, index: seatIndex },
    });
    if (!seat) throw new NotFoundException('Seat not found');

    if (!seat.userId) throw new BadRequestException('Seat is empty');

    // Update seat mic status
    await this.prisma.seat.update({
      where: { id: seat.id },
      data: { micOn: !mute },
    });

    // Update participant UI state
    await this.prisma.roomParticipant.updateMany({
      where: { roomId, userId: seat.userId },
      data: { muted: mute },
    });

    return { ok: true, userId: seat.userId };
  }

  async muteSeat(roomId: string, seatIndex: number) {
    const seat = await this.seatsRepo.findSeatByRoomAndIndex(roomId, seatIndex);
    if (!seat) throw new NotFoundException('Seat not found');
    await this.prisma.seat.update({
      where: { id: seat.id },
      data: { micOn: false },
    });
    return { ok: true };
  }

  async kickSeat(roomId: string, seatIndex: number) {
    const seat = await this.seatsRepo.findSeatByRoomAndIndex(roomId, seatIndex);
    if (!seat) throw new NotFoundException('Seat not found');
    await this.prisma.seat.update({
      where: { id: seat.id },
      data: { userId: null, micOn: true },
    });
    return { ok: true };
  }
}
