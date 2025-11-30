import { Body, Controller, Delete, Param, Post } from '@nestjs/common';
import { ReSellerManagementService } from './re-seller-management.service';

@Controller('re-seller-management')
export class ReSellerManagementController {
  constructor(
    private readonly reSellerManagementService: ReSellerManagementService,
  ) {}

  // Add a user as a coin reseller
  @Post('add/:userId')
  async addReseller(@Param('userId') userId: string) {
    return this.reSellerManagementService.addReseller(userId);
  }

  // Remove a user from coin resellers
  @Delete('remove/:userId')
  async removeReseller(@Param('userId') userId: string) {
    return this.reSellerManagementService.removeReseller(userId);
  }

  // Send coins to a reseller account
  @Post('send-coins')
  async sendCoins(
    @Body('sellerId') sellerId: string,
    @Body('amount') amount: number,
  ) {
    return this.reSellerManagementService.sendCoinsToReseller(sellerId, amount);
  }
}
