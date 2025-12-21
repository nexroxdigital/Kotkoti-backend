import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ReSellerManagementService } from './re-seller-management.service';

@Controller('re-seller-management')
export class ReSellerManagementController {
  constructor(
    private readonly reSellerManagementService: ReSellerManagementService,
  ) {}

  // Get User List
  @Get('user-list')
  async getUserList() {
    return this.reSellerManagementService.getUserList();
  }

  // Get Reseller List
  @Get('reseller-list')
  async getResellerList() {
    return this.reSellerManagementService.getResellerList();
  }

  @Get('/seller-profile/:userId')
  async getOwnCoinSellerInfo(@Param('userId') userId: string) {
    return this.reSellerManagementService.getOwnCoinSellerInfo(userId);
  }

  // Add a user as a coin reseller
  @Post('add/:userId/:amount')
  async addReseller(
    @Param('userId') userId: string,
    @Param('amount') amount: number,
  ) {
    return this.reSellerManagementService.addReseller(userId, amount);
  }

  // Remove a user from coin resellers
  @Patch('deactivate/:userId')
  async deactivateReseller(@Param('userId') userId: string) {
    return this.reSellerManagementService.deactivateReseller(userId);
  }

  // Activate a user as coin reseller
  @Patch('activate/:userId')
  async activateReseller(@Param('userId') userId: string) {
    return this.reSellerManagementService.activateReseller(userId);
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
