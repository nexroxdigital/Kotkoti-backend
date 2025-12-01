import { Module } from '@nestjs/common';
import { CoinResellerService } from './coin-reseller.service';
import { CoinResellerController } from './coin-reseller.controller';

@Module({
  controllers: [CoinResellerController],
  providers: [CoinResellerService],
})
export class CoinResellerModule {}
