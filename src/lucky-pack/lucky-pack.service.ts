import {
  BadRequestException,
  forwardRef,
  Inject,
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
    @Inject(forwardRef(() => LuckyPackGateway))
    private readonly gateway: LuckyPackGateway,
  ) {}

  // Create a lucky pack
  async createLuckyPack(
    creatorId: string,
    roomId: string,
    totalGold: number,
    maxClaims: number,
  ) {
    // Deduct 20% for company
    const companyCut = Math.floor(totalGold * 0.2);
    const goldForLuckyBag = totalGold - companyCut;

    // Deduct totalGold from creator
    const creator = await this.prisma.user.findUnique({
      where: { id: creatorId },
    });
    if (!creator) throw new NotFoundException('Creator not found');

    if ((creator.gold ?? 0) < totalGold) {
      throw new BadRequestException('Not enough gold to create lucky pack');
    }

    await this.prisma.user.update({
      where: { id: creatorId },
      data: { gold: { decrement: totalGold } },
    });

    // Create lucky pack
    const pack = await this.prisma.luckyPack.create({
      data: {
        creatorId,
        roomId,
        totalGold: goldForLuckyBag,
        remainingGold: goldForLuckyBag,
        totalClaimers: maxClaims,
        maxClaims,
      },
    });

    // Notify room participants via gateway
    await this.gateway.notifyRoomLuckyPack(roomId, pack);

    return pack;
  }

  // Claim a lucky pack
  async claimLuckyPack(packId: string, userId: string) {
    const pack = await this.prisma.luckyPack.findUnique({
      where: { id: packId },
      include: { claims: true },
    });
    if (!pack) throw new NotFoundException('Lucky pack not found');

    if (pack.creatorId === userId)
      throw new BadRequestException('Creator cannot claim this pack');

    if (pack.claims.some((c) => c.userId === userId))
      throw new BadRequestException('User already claimed this pack');

    if (pack.claims.length >= pack.maxClaims)
      throw new BadRequestException('Lucky pack fully claimed');

    if (pack.remainingGold <= 0)
      throw new BadRequestException('No gold left to claim');

    // Random gold for this claim (min 1 coin)
    const remainingClaims = pack.maxClaims - pack.claims.length;
    const maxGoldForThisUser = pack.remainingGold - (remainingClaims - 1); // leave at least 1 coin for others
    const goldClaimed = Math.floor(Math.random() * maxGoldForThisUser) + 1;

    // Update receiver diamond (1 diamond per 10 gold)
    const diamondReceived = goldClaimed;
    await this.prisma.user.update({
      where: { id: userId },
      data: { diamond: { increment: diamondReceived } },
    });

    // Update lucky pack remaining gold and claims
    const updatedPack = await this.prisma.luckyPack.update({
      where: { id: packId },
      data: {
        remainingGold: { decrement: goldClaimed },
        claimedCount: { increment: 1 },
        claims: {
          create: { userId, goldClaimed, diamondGot: diamondReceived },
        },
      },
      include: { claims: true },
    });

    // Update creator wealth points
    const creator = await this.prisma.user.findUnique({
      where: { id: pack.creatorId },
    });
    if (creator) {
      const newWealth = (creator.wealthPoint ?? 0) + goldClaimed;
      await this.prisma.user.update({
        where: { id: creator.id },
        data: { wealthPoint: newWealth },
      });
    }

    return {
      packId: updatedPack.id,
      userId,
      goldClaimed,
      diamondGot: diamondReceived,
      remainingGold: updatedPack.remainingGold,
      claims: updatedPack.claims,
      roomId: pack.roomId,
    };
  }
}
