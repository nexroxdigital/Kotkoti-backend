import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CoinResellerService } from './coin-reseller.service';
import { ReSellerDto } from './dto/re-seller.dto';

@Controller('coin-reseller')
export class CoinResellerController {
  constructor(private readonly coinResellerService: CoinResellerService) {}

  // Add coins to a user profile
  @Post('re-seller')
  async addCoins(@Body() dto: ReSellerDto) {
    return this.coinResellerService.addCoins(dto);
  }

  // Get selling history for a seller
  @Get('selling-history/:sellerId')
  async getSellingHistory(@Param('sellerId') sellerId: string) {
    return this.coinResellerService.getSellingHistory(sellerId);
  }

  // Get buying history for a seller
  @Get('buying-history/:sellerId')
  async getBuyingHistory(@Param('sellerId') sellerId: string) {
    return this.coinResellerService.getBuyingHistory(sellerId);
  }
}
