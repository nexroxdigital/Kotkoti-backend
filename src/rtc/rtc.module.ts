import { Module } from '@nestjs/common';
import { RtcService } from './rtc.service';
import { AgoraUtil } from './providers/agora.util';
import { ZegoUtil } from './providers/zego.util';

@Module({
  providers: [RtcService, AgoraUtil, ZegoUtil],
  exports: [RtcService],
})
export class RtcModule {}
