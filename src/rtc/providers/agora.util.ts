import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RtcTokenBuilder, RtcRole } from 'agora-access-token';

@Injectable()
export class AgoraUtil {
  constructor(private cfg: ConfigService) {}

  generateToken(channelName: string, uid: number, role: 'publisher' | 'subscriber', expireSeconds = 3600) {
    const appId = process.env.AGORA_APP_ID as string;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE as string;
    const now = Math.floor(Date.now() / 1000);
    const privilegeExpireTs = now + expireSeconds;
    const rtcRole = role === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;

    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid,
      rtcRole,
      privilegeExpireTs,
    );

    return {
      token,
      expiresAt: new Date(privilegeExpireTs * 1000),
    };
  }
}
