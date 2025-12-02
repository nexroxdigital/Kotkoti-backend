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
  constructor(private prisma: PrismaService, private seatsRepo: SeatsRepository) {}

  async requestSeat(roomId: string, userId: string, seatIndex?: number) {
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

  async approveSeatRequest(requestId: string, hostId: string, accept: boolean) {
    const req = await this.prisma.seatRequest.findUnique({ where: { id: requestId } });
    if (!req) throw new NotFoundException('Seat request not found');

    const room = await this.prisma.audioRoom.findUnique({ where: { id: req.roomId } });
    if (!room) throw new NotFoundException('Room not found');
    if (room.hostId !== hostId) throw new BadRequestException('Only host can approve');

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

    await this.prisma.seat.update({
      where: { id: seat.id },
      data: { userId: req.userId, micOn: true },
    });

    await this.prisma.seatRequest.update({
      where: { id: requestId },
      data: { status: 'ACCEPTED' },
    });

    return { ok: true, seatIndex: seat.index };
  }

  async leaveSeat(roomId: string, userId: string) {
    const seat = await this.prisma.seat.findFirst({ where: { roomId, userId } });
    if (!seat) throw new NotFoundException('User not on seat');
    await this.prisma.seat.update({
      where: { id: seat.id },
      data: { userId: null, micOn: true },
    });
    return { ok: true };
  }

  async toggleMic(roomId: string, userId: string, micOn: boolean) {
    const seat = await this.prisma.seat.findFirst({ where: { roomId, userId } });
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
