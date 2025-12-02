import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { GiftGateway } from './gift.gateway';

@Injectable()
export class GiftService {
  private readonly logger = new Logger(GiftService.name);

  constructor(
    private prisma: PrismaService,
    private readonly gateway: GiftGateway,
  ) {}

  // 1. Get all gift categories
  async getAllCategories() {
    const items = await this.prisma.giftCategory.findMany({
      orderBy: { name: 'asc' },
    });

    const result = { items, total: items.length };
    return result;
  }

  // 2. Get gifts by category
  async getGiftsByCategory(categoryId: string) {
    // category must exist
    const category = await this.prisma.giftCategory.findUnique({
      where: { id: categoryId },
    });
    if (!category) throw new NotFoundException('Category not found');

    const items = await this.prisma.gift.findMany({
      where: { categoryId },
      orderBy: { name: 'asc' },
    });

    const result = { items, total: items.length };
    return result;
  }

  /**
   * Send a single gift from sender to receiver
   */
  async sendGift(giftId: string, senderId: string, receiverId: string) {
    // 1Fetch gift
    const gift = await this.prisma.gift.findUnique({ where: { id: giftId } });
    if (!gift) throw new NotFoundException('Gift not found');

    const totalCoins = gift.needCoin;

    // Run all DB updates inside a transaction
    const result = await this.prisma.$transaction(async (prisma) => {
      // Deduct sender gold
      const sender = await prisma.user.updateMany({
        where: { id: senderId, gold: { gte: totalCoins } },
        data: { gold: { decrement: totalCoins } },
      });
      if (sender.count === 0)
        throw new BadRequestException('Insufficient gold');

      // Fetch updated sender with points and wealthLevel
      const updatedSender = await prisma.user.findUnique({
        where: { id: senderId },
      });

      if (!updatedSender) throw new NotFoundException('Sender not found');

      // Add diamond to receiver
      const updatedReceiver = await prisma.user.update({
        where: { id: receiverId },
        data: { diamond: { increment: totalCoins } },
      });

      // Update wealthPoints for sender
      const senderNewWealth = (updatedSender.wealthPoint ?? 0) + totalCoins;
      await prisma.user.update({
        where: { id: senderId },
        data: { wealthPoint: senderNewWealth },
      });

      // Update charmPoints for receiver
      const receiverBefore = await prisma.user.findUnique({
        where: { id: receiverId },
      });

      if (!receiverBefore) throw new NotFoundException('Receiver not found');

      const receiverNewCharm = (receiverBefore.charmPoint ?? 0) + totalCoins;
      await prisma.user.update({
        where: { id: receiverId },
        data: { charmPoint: receiverNewCharm },
      });

      // Create gift transaction
      const transaction = await prisma.giftTransaction.create({
        data: {
          senderId,
          receiverId,
          giftId,
          quantity: 1,
          totalCoins,
          streamId: 'none',
        },
      });

      // Check sender wealth level
      const newWealthLevel = await prisma.wealthLevel.findFirst({
        where: { levelup_point: { lte: senderNewWealth } },
        orderBy: { levelNo: 'desc' },
      });
      if (newWealthLevel && updatedSender.wealthLevelId !== newWealthLevel.id) {
        await prisma.user.update({
          where: { id: senderId },
          data: { wealthLevelId: newWealthLevel.id },
        });
      }

      // Check receiver charm level
      const newCharmLevel = await prisma.charmLevel.findFirst({
        where: { levelup_point: { lte: receiverNewCharm } },
        orderBy: { levelNo: 'desc' },
      });

      if (newCharmLevel && receiverBefore.charmLevelId !== newCharmLevel.id) {
        await prisma.user.update({
          where: { id: receiverId },
          data: { charmLevelId: newCharmLevel.id },
        });
      }

      return { transaction, senderId, receiverId, giftId, totalCoins };
    });

    // Emit gift to receiver via gateway
    await this.gateway.sendGiftToUser(result.receiverId, {
      giftId: result.giftId,
      senderId: result.senderId,
      totalCoins: result.totalCoins,
    });

    return {
      status: 'ok',
      message: 'Gift sent successfully',
      data: result.transaction,
    };
  }
}
