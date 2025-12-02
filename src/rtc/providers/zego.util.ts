import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class ZegoUtil {
  constructor(private cfg: ConfigService) {}

  generateToken(roomId: string, userId: string, expireSeconds = 3600) {
    const appId = this.cfg.get<string>('zego.appId');
    const serverSecret = this.cfg.get<string>('zego.serverSecret') || '';

    const ts = Math.floor(Date.now() / 1000);
    const nonce = crypto.randomBytes(8).toString('hex');

    const payload = {
      app_id: appId,
      user_id: userId,
      room_id: roomId,
      nonce,
      ts,
      expire: expireSeconds,
    };

    const payloadStr = JSON.stringify(payload);
    const signature = crypto
      .createHmac('sha256', serverSecret)
      .update(payloadStr)
      .digest('base64');

    const tokenObj = { payload, signature };
    const token = Buffer.from(JSON.stringify(tokenObj)).toString('base64');

    return {
      token,
      expiresAt: new Date((ts + expireSeconds) * 1000),
    };
  }
}
