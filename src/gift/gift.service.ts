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

  // Get all gift categories
  async getAllCategories() {
    const items = await this.prisma.giftCategory.findMany({
      orderBy: { name: 'asc' },
    });

    const result = { items, total: items.length };
    return result;
  }

  // Get gifts by category
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

  // Send a gift from sender to one or more receivers with specified quantity
  async sendGift(giftId: string, senderId: string, receiverId: string[], quantity: number = 1) {
    // Fetch gift
    const gift = await this.prisma.gift.findUnique({ where: { id: giftId } });
    if (!gift) throw new NotFoundException('Gift not found');

    const receiverCount = receiverId.length;
    
    // Calculate total gift value and per-receiver amount
    const totalGiftValue = gift.needCoin * quantity;
    const coinsPerReceiver = Math.floor(totalGiftValue / receiverCount);

    // Run all DB updates inside a transaction
    const result = await this.prisma.$transaction(async (prisma) => {
      // Deduct sender gold (total gift value)
      const sender = await prisma.user.updateMany({
        where: { id: senderId, gold: { gte: totalGiftValue } },
        data: { gold: { decrement: totalGiftValue } },
      });
      if (sender.count === 0)
        throw new BadRequestException('Insufficient gold');

      // Fetch updated sender
      const updatedSender = await prisma.user.findUnique({
        where: { id: senderId },
      });

      if (!updatedSender) throw new NotFoundException('Sender not found');

      // Update wealthPoints for sender (total gift value)
      const senderNewWealth = (updatedSender.wealthPoint ?? 0) + totalGiftValue;
      await prisma.user.update({
        where: { id: senderId },
        data: { wealthPoint: senderNewWealth },
      });

      // Process each receiver
      const transactions: any[] = [];
      for (const recId of receiverId) {
        // Add diamond to receiver (their share of total)
        await prisma.user.update({
          where: { id: recId },
          data: { diamond: { increment: coinsPerReceiver } },
        });

        // Update charmPoints for receiver
        const receiverBefore = await prisma.user.findUnique({
          where: { id: recId },
        });

        if (!receiverBefore) throw new NotFoundException(`Receiver ${recId} not found`);

        const receiverNewCharm = (receiverBefore.charmPoint ?? 0) + coinsPerReceiver;
        await prisma.user.update({
          where: { id: recId },
          data: { charmPoint: receiverNewCharm },
        });

        // Create gift transaction for this receiver
        const transaction = await prisma.giftTransaction.create({
          data: {
            senderId,
            receiverId: recId,
            giftId,
            quantity: quantity,
            totalCoins: coinsPerReceiver,
            streamId: 'none',
          },
        });

        transactions.push(transaction);
      }

      return { transactions, senderId, receiverId, giftId, totalGiftValue, coinsPerReceiver, quantity };
    });

    // Emit gift to all receivers via gateway
    for (const recId of result.receiverId) {
      await this.gateway.sendGiftToUser(recId, {
        giftId: result.giftId,
        senderId: result.senderId,
        receiverId: recId,
        totalCoins: result.coinsPerReceiver,
        quantity: result.quantity,
      });
    }

    return {
      status: 'ok',
      message: `Gift sent successfully: ${quantity}x gift to ${receiverCount} receiver(s)`,
      data: {
        transactions: result.transactions,
        totalGiftValue: result.totalGiftValue,
        coinsPerReceiver: result.coinsPerReceiver,
        quantity: result.quantity,
      },
    };
  }
}
