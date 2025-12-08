import { Module } from '@nestjs/common';
import { SvipService } from './svip.service';
import { SvipController } from './svip.controller';

@Module({
  controllers: [SvipController],
  providers: [SvipService],
  exports: [SvipService],
})
export class SvipModule {}
