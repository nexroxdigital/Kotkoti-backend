import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ReSellerDto } from './dto/re-seller.dto';

@Injectable()
export class CoinResellerService {
  constructor(private readonly prisma: PrismaService) {}

  // Get coin reseller's own profile
  async getOwnCoinSellerInfo(userId: string) {
    const reseller = await this.prisma.coinSeller.findUnique({
      where: { userId }, // userId is unique
    });

    if (!reseller) throw new NotFoundException('Reseller not found');

    return {
      message: 'Reseller info fetched successfully',
      coinSeller: {
        id: reseller.id,
        userId: reseller.userId,
        totalCoin: reseller.totalCoin,
        status: reseller.status,
        createdAt: reseller.createdAt,
      },
    };
  }

  async sendCoins(dto: ReSellerDto) {
    const { sellerId, receiverId, amount } = dto;

    return this.prisma.$transaction(async (tx) => {
      const seller = await tx.coinSeller.findUnique({
        where: { userId: sellerId },
      });

      if (!seller) throw new NotFoundException('Seller not found');

      if (seller.totalCoin < amount) {
        throw new BadRequestException('Seller does not have enough coins');
      }

      const operations = [
        // Deduct coins
        tx.coinSeller.update({
          where: { id: seller.id },
          data: { totalCoin: { decrement: amount } },
        }),

        // Add coins to receiver
        tx.user.update({
          where: { id: receiverId },
          data: { gold: { increment: amount } },
        }),

        // Save selling history
        tx.coinsSellingHistory.create({
          data: {
            sellerId: seller.id,
            receiverId,
            amount,
            status: 'COMPLETED',
          },
        }),

        // Save recharge log
        tx.rechargeLog.create({
          data: {
            userId: receiverId,
            sellerId: seller.id,
            amount,
            status: 'COMPLETED',
          },
        }),
      ];

      await Promise.all(operations);

      return { message: 'Coins transferred successfully' };
    });
  }

  // Get selling history for a seller
  async getSellingHistory(sellerId: number) {
    const history = await this.prisma.coinsSellingHistory.findMany({
      where: { sellerId },
      include: {
        seller: {
          select: { id: true },
        },
        receiver: {
          select: {
            id: true,
            nickName: true,
            profilePicture: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (history.length === 0) {
      return { seller: null, receivers: [] };
    }

    return {
      seller: history[0].seller,
      receivers: history.map((item) => ({
        id: item.receiver.id,
        nickName: item.receiver.nickName,
        amount: item.amount,
        status: item.status,
        createdAt: item.createdAt,
      })),
    };
  }

  // Get buying history for a seller
  async getBuyingHistory(sellerId: number) {
    return this.prisma.coinsBuyingHistory.findMany({
      where: { sellerId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
