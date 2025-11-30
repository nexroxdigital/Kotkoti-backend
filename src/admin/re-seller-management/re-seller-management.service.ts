import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ReSellerManagementService {
  constructor(private readonly prisma: PrismaService) {}

  // Add a user as a coin reseller
  async addReseller(userId: string) {
    const user = await this.prisma.user.findFirst({ where: { id: userId } });

    if (!user) throw new NotFoundException('User not found');

    // Check if already a reseller
    const existing = await this.prisma.coinSeller.findFirst({
      where: { userId },
    });

    if (existing) throw new BadRequestException('User is already a reseller');

    const reseller = await this.prisma.coinSeller.create({
      data: {
        userId,
        totalCoin: 0,
        status: 'ACTIVE',
        createdAt: new Date(),
      },
    });

    return { message: 'User added as coin reseller', reseller };
  }

  // Remove a user from coin resellers
  async removeReseller(userId: string) {
    const reseller = await this.prisma.coinSeller.findFirst({
      where: { userId },
    });
    if (!reseller) throw new NotFoundException('Reseller not found');

    await this.prisma.coinSeller.delete({ where: { id: reseller.id } });
    return { message: 'User removed from coin resellers' };
  }

  // Send coins to a reseller account
  async sendCoinsToReseller(sellerId: string, amount: number) {
    const reseller = await this.prisma.coinSeller.findUnique({
      where: { id: sellerId },
    });
    if (!reseller) throw new NotFoundException('Reseller not found');

    if (amount <= 0)
      throw new BadRequestException('Amount must be greater than 0');

    const updated = await this.prisma.coinSeller.update({
      where: { id: sellerId },
      data: { totalCoin: { increment: amount } },
    });

    return { message: 'Coins sent to reseller', reseller: updated };
  }
}
