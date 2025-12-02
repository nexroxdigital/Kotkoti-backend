import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SeatsRepository {
  constructor(private prisma: PrismaService) {}

  async findSeatByRoomAndIndex(roomId: string, index: number) {
    return this.prisma.seat.findFirst({ where: { roomId, index } });
  }
}
