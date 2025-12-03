import { Module } from '@nestjs/common';
import { LuckyPackController } from './lucky-pack.controller';
import { LuckyPackGateway } from './lucky-pack.gateway';
import { LuckyPackService } from './lucky-pack.service';

@Module({
  controllers: [LuckyPackController],
  providers: [LuckyPackService, LuckyPackGateway],
  exports: [LuckyPackService],
})
export class LuckyPackModule {}
