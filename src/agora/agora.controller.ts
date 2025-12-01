import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { AgoraService } from './agora.service';

@Controller('token')
export class AgoraController {
  constructor(private readonly agoraService: AgoraService) {}

  @Get('generate')
  getAgoraToken(
    @Query('channel') channel: string,
    @Query('uid') uidStr: string,
  ) {
    if (!channel) {
      throw new BadRequestException('channel is required');
    }
    const uid = parseInt(uidStr);

    return this.agoraService.generateRtcToken(channel, uid);
  }
}
