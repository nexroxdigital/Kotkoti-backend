import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AgoraUtil } from './providers/agora.util';
import { ZegoUtil } from './providers/zego.util';
import { Provider } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RtcService {
  constructor(
    private agora: AgoraUtil,
    private zego: ZegoUtil,
  ) {}

  async issueToken(
    provider: Provider,
    roomId: string,
    role: 'publisher' | 'subscriber',
    existingUid?: number,
  ) {
    const rtcUid = existingUid ?? Math.floor(Math.random() * 1e9);
    const expire = 3600;

    if (provider === 'AGORA') {
      const { token, expiresAt } = this.agora.generateToken(
        `room_${roomId}`,
        rtcUid,
        role,
        expire,
      );

      return { token, uid: rtcUid, expiresAt };
    }

    const { token, expiresAt } = this.zego.generateToken(
      roomId,
      String(rtcUid),
      expire,
    );

    return { token, uid: rtcUid, expiresAt };
  }



  async disconnectUser(provider: Provider, roomId: string, userId: string) {
    // Implement Agora/Zego kick if desired
    return true;
  }

  async disconnectRoom(provider: Provider, roomId: string) {
    // Optional: destroy room at provider
    return true;
  }
}
