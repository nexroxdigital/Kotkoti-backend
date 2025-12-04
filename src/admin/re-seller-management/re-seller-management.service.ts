import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ReSellerManagementService {
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

  // Add a user as a coin reseller
  async addReseller(userId: string) {
    const user = await this.prisma.user.findFirst({ where: { id: userId } });

    if (!user) throw new NotFoundException('User not found');

    // Check if already a reseller
    const existing = await this.prisma.coinSeller.findFirst({
      where: { userId },
    });

    if (existing) throw new BadRequestException('User is already a reseller');

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isReseller: true,
      },
    });

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

    // await this.prisma.coinSeller.delete({ where: { id: reseller.id } });

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isReseller: false,
      },
    });

    await this.prisma.coinSeller.update({
      where: { userId: userId },
      data: {
        status: 'in-active',
      },
    });

    return { message: 'User removed from coin resellers' };
  }

  // Send coins to a reseller WITH buying history + transaction
  async sendCoinsToReseller(sellerUserId: string, amount: number) {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    return await this.prisma.$transaction(async (tx) => {
      //  Find reseller by userId
      const reseller = await tx.coinSeller.findUnique({
        where: { userId: sellerUserId },
      });

      if (!reseller) throw new NotFoundException('Reseller not found');

      //  Increase reseller's coins
      const updatedReseller = await tx.coinSeller.update({
        where: { id: reseller.id },
        data: { totalCoin: { increment: amount } },
      });

      // Create buying history
      await tx.coinsBuyingHistory.create({
        data: {
          sellerId: reseller.id,
          amount,
          status: 'RECEIVED',
        },
      });

      return {
        message: 'Coins sent to reseller successfully',
        reseller: updatedReseller,
      };
    });
  }
}
