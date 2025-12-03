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
  role: 'publisher' | 'subscriber',
   existingUid?: number, 
) {
  const expire = 3600;
  console.log('ISSUING RTC TOKEN', { provider, roomId, role });
  // Generate ONE rtcUid on server
  const rtcUid = existingUid?? Math.floor(Math.random() * 1_000_000_000);

  if (provider === 'AGORA') {
    const channelName = `room_${roomId}`;

    const { token, expiresAt } = this.agora.generateToken(
      channelName,
      rtcUid,
      role,
      expire
    );

    return {
      provider,
      token,
      expiresAt,
      uid: rtcUid,  // SEND UID TO FRONTEND
    };
  }

  // Zego
  const { token, expiresAt } = this.zego.generateToken(roomId, String(rtcUid), expire);

  return {
    provider,
    token,
    expiresAt,
    uid: rtcUid,
  };
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
