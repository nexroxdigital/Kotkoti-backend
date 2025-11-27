import { Module } from '@nestjs/common';
import { BackpackController } from './backpack.controller';
import { BackpackService } from './backpack.service';

@Module({
  controllers: [BackpackController],
  providers: [BackpackService],
})
export class BackpackModule {}
