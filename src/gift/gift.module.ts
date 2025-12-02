import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { GiftController } from './gift.controller';
import { GiftGateway } from './gift.gateway';
import { GiftService } from './gift.service';

@Module({
  controllers: [GiftController],
  providers: [GiftService, GiftGateway, PrismaService],
  exports: [GiftService],
})
export class GiftModule {}
