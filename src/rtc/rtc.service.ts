import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AgoraUtil } from './providers/agora.util';
import { ZegoUtil } from './providers/zego.util';
import { Provider } from '@prisma/client';

@Injectable()
export class RtcService {
  constructor(
    private cfg: ConfigService,
    private agora: AgoraUtil,
    private zego: ZegoUtil,
  ) {}


  
  async issueToken(
    provider: Provider,
    roomId: string,
    userId: string,
    role: 'publisher' | 'subscriber' = 'publisher',
  ) {
    const expire = 3600;

    if (provider === 'AGORA') {
      const channelName = `room_${roomId}`;
      const uid = Number(userId.replace(/[^0-9]/g, '').slice(0, 9)) || 1;
      const { token, expiresAt } = this.agora.generateToken(channelName, uid, role, expire);
      return { provider, token, expiresAt };
    } else {
      const { token, expiresAt } = this.zego.generateToken(roomId, userId, expire);
      return { provider, token, expiresAt };
    }
  }

  async disconnectUser(provider: Provider, roomId: string, userId: string) {
    // Implement provider admin kick if desired
    return true;
  }

  async disconnectRoom(provider: Provider, roomId: string) {
    // Implement destroy room at provider if needed
    return true;
  }
}
