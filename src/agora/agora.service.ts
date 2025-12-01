import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RtcRole, RtcTokenBuilder } from 'agora-access-token';

@Injectable()
export class AgoraService {
  constructor(private configService: ConfigService) {}

  generateRtcToken(channelName: string, uid: number) {
    const appId = this.configService.get<string>('AGORA_APP_ID');
    const appCertificate = this.configService.get<string>(
      'AGORA_APP_CERTIFICATE',
    );

    if (!appId || !appCertificate) {
      throw new Error('Agora credentials are not configured properly');
    }

    // random UID for the user
    // const uid = Math.floor(Math.random() * 100000);

    const role = RtcRole.PUBLISHER; // host-level perms
    const expireSeconds = 3600; // 1 hour

    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpireTime = currentTimestamp + expireSeconds;

    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid,
      role,
      privilegeExpireTime,
    );

    return { token, uid, expireSeconds };
  }
}
