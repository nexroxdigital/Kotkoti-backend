// src/lucky-pack/lucky-pack.service.ts
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { LuckyPackGateway } from './lucky-pack.gateway';

@Injectable()
export class LuckyPackService {
  private readonly logger = new Logger(LuckyPackService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: LuckyPackGateway,
  ) {}

  // Create a lucky pack
  async createLuckyPack(
    creatorId: string,
    roomId: string,
    totalGold: number,
    maxClaims: number,
  ) {
    const pack = await this.prisma.luckyPack.create({
      data: {
        creatorId,
        roomId,
        totalGold,
        maxClaims,
        remainingGold: totalGold,
      },
    });

    // Notify room participants via gateway
    await this.gateway.notifyRoomLuckyPack(roomId, pack);

    return pack;
  }

  // Claim a lucky pack
  async claimLuckyPack(packId: string, userId: string) {
    // Fetch lucky pack
    const pack = await this.prisma.luckyPack.findUnique({
      where: { id: packId },
      include: { claims: true },
    });
    if (!pack) throw new NotFoundException('Lucky pack not found');

    // Creator cannot claim
    if (pack.creatorId === userId)
      throw new BadRequestException('Creator cannot claim');

    // Check if user already claimed
    if (pack.claims.some((c) => c.userId === userId)) {
      throw new BadRequestException('User already claimed this pack');
    }

    // Check if max claims reached
    if (pack.claims.length >= pack.maxClaims) {
      throw new BadRequestException('Lucky pack fully claimed');
    }

    // Calculate each claim gold
    const claimGold = Math.floor(pack.totalGold / pack.maxClaims);

    // Update user diamond (1 diamond per 10 gold)
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { diamond: { increment: Math.floor(claimGold / 10) } },
    });

    // Update lucky pack remaining gold
    const updatedPack = await this.prisma.luckyPack.update({
      where: { id: packId },
      data: {
        remainingGold: { decrement: claimGold },
        claims: { create: { userId, goldReceived: claimGold } },
      },
      include: { claims: true },
    });

    // Update sender wealth points
    const creator = await this.prisma.user.findUnique({
      where: { id: pack.creatorId },
    });
    if (creator) {
      const newWealth = (creator.wealthPoint ?? 0) + claimGold;
      await this.prisma.user.update({
        where: { id: creator.id },
        data: { wealthPoint: newWealth },
      });
    }

    return {
      packId: updatedPack.id,
      userId,
      goldReceived: claimGold,
      remainingGold: updatedPack.remainingGold,
      claims: updatedPack.claims,
      roomId: pack.roomId,
    };
  }
}
