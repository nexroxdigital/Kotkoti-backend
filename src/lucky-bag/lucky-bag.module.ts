import { Module } from '@nestjs/common';
import { LuckyBagController } from './lucky-bag.controller';
import { LuckyBagService } from './lucky-bag.service';

@Module({
  controllers: [LuckyBagController],
  providers: [LuckyBagService],
})
export class LuckyBagModule {}
