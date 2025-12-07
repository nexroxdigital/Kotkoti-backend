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

  // Add coins with full transaction (deduct from seller, add to receiver)
  async sendCoins(dto: ReSellerDto) {
    return this.prisma.$transaction(async (tx) => {
      // Find seller
      const seller = await tx.coinSeller.findUnique({
        where: { userId: dto.sellerId },
      });

      if (!seller) throw new NotFoundException('Seller not found');

      // Check if seller has enough balance
      if (seller.totalCoin < dto.amount) {
        throw new BadRequestException('Seller does not have enough coins');
      }

      // Deduct coins from seller
      await tx.coinSeller.update({
        where: { id: seller.id },
        data: {
          totalCoin: {
            decrement: dto.amount,
          },
        },
      });

      // Add coins to receiver
      await tx.user.update({
        where: { id: dto.receiverId },
        data: {
          gold: {
            increment: dto.amount,
          },
        },
      });

      // Create selling history
      await tx.coinsSellingHistory.create({
        data: {
          sellerId: seller.id,
          receiverId: dto.receiverId,
          amount: dto.amount,
          status: 'COMPLETED',
        },
      });

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
