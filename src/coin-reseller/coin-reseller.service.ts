import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ReSellerDto } from './dto/re-seller.dto';

@Injectable()
export class CoinResellerService {
  constructor(private readonly prisma: PrismaService) {}

  // add coins to a user profile
  async addCoins(dto: ReSellerDto) {
    // Find seller
    const seller = await this.prisma.coinSeller.findUnique({
      where: { id: dto.sellerId },
    });

    if (!seller) throw new NotFoundException('Seller not found');

    //Update user's coins
    const user = await this.prisma.user.update({
      where: { id: dto.receiverId },
      data: { gold: { increment: dto.amount } },
    });

    // Create selling history
    await this.prisma.coinsSellingHistory.create({
      data: {
        sellerId: dto.sellerId,
        receiverId: dto.receiverId,
        amount: dto.amount,
        status: 'COMPLETED',
        createdAt: new Date(),
      },
    });

    return { message: 'Coins added successfully', user };
  }

  // get selling history for a seller
  async getSellingHistory(sellerId: string) {
    const history = await this.prisma.coinsSellingHistory.findMany({
      where: { sellerId },
      include: { receiver: true },
      orderBy: { createdAt: 'desc' },
    });
    return history;
  }

  // get buying history for a seller
  async getBuyingHistory(sellerId: string) {
    const history = await this.prisma.coinsBuyingHistory.findMany({
      where: { sellerId },
      include: { seller: true },
      orderBy: { createdAt: 'desc' },
    });
    return history;
  }
}
