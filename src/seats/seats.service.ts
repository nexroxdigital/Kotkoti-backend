import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SeatsRepository } from './seats.repository';
import { v4 as uuidv4 } from 'uuid';
import { Seat } from '@prisma/client';

@Injectable()
export class SeatsService {
  constructor(
    private prisma: PrismaService,
    private seatsRepo: SeatsRepository,
  ) {}

  async requestSeat(roomId: string, userId: string, seatIndex?: number) {
    const room = await this.prisma.audioRoom.findUnique({
      where: { id: roomId },
    });
    if (!room) throw new NotFoundException('Room not found');

    // Host should not create requests
    if (room.hostId === userId) {
      throw new BadRequestException('Host does not need to request seats');
    }

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

  async userHasSeat(roomId: string, userId: string): Promise<boolean> {
    const seat = await this.prisma.seat.findFirst({
      where: { roomId, userId },
    });

    return !!seat;
  }

  async hostTakeSeat(roomId: string, hostId: string, seatIndex: number) {
    const room = await this.prisma.audioRoom.findUnique({
      where: { id: roomId },
    });
    if (!room) throw new NotFoundException('Room not found');

    if (room.hostId !== hostId) {
      throw new BadRequestException('Only host can call this');
    }

    const seat = await this.prisma.seat.findFirst({
      where: { roomId, index: seatIndex },
    });

    if (!seat) throw new NotFoundException('Seat not found');
    if (seat.locked) throw new BadRequestException('Seat is locked');

    // Remove host from existing seat (only one seat per user)
    await this.prisma.seat.updateMany({
      where: { roomId, userId: hostId },
      data: { userId: null, micOn: true },
    });

    // Assign seat to host
    await this.prisma.seat.update({
      where: { id: seat.id },
      data: { userId: hostId, micOn: true },
    });

    // Return updated seats
    const seats = await this.prisma.seat.findMany({
      where: { roomId },
      orderBy: { index: 'asc' },
    });

    return seats;
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

  if (!accept) {
    await this.prisma.seatRequest.update({
      where: { id: requestId },
      data: { status: 'DENIED' },
    });
    return { ok: true };
  }

  let seat: Seat | null;
  if (req.seatIndex != null) {
    seat = await this.prisma.seat.findFirst({
      where: { roomId: req.roomId, index: req.seatIndex, locked: false },
    });
  } else {
    seat = await this.prisma.seat.findFirst({
      where: { roomId: req.roomId, userId: null, locked: false },
    });
  }

  if (!seat) throw new BadRequestException('No free seat');

  // ✅ REMOVE USER FROM ANY OLD SEAT FIRST
  await this.prisma.seat.updateMany({
    where: { roomId: req.roomId, userId: req.userId },
    data: { userId: null, micOn: true },
  });

  // ✅ ASSIGN NEW SEAT
  await this.prisma.seat.update({
    where: { id: seat.id },
    data: { userId: req.userId, micOn: true },
  });

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
    if (!seat) throw new NotFoundException('User not on seat');
    await this.prisma.seat.update({
      where: { id: seat.id },
      data: { userId: null, micOn: true },
    });
    return { ok: true };
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

  async lockSeat(roomId: string, seatIndex: number, lock: boolean) {
    const seat = await this.seatsRepo.findSeatByRoomAndIndex(roomId, seatIndex);
    if (!seat) throw new NotFoundException('Seat not found');
    await this.prisma.seat.update({
      where: { id: seat.id },
      data: { locked: lock },
    });
    return { ok: true };
  }
}
