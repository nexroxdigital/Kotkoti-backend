import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AgoraUtil } from './providers/agora.util';
import { ZegoUtil } from './providers/zego.util';
import { Provider } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RtcService {
  constructor(
    private cfg: ConfigService,
    private agora: AgoraUtil,
    private zego: ZegoUtil,
    private prisma: PrismaService,
  ) {}


  // private ensureUid(existingUid?: string | null): number {
  //   if (!existingUid) {
  //     throw new BadRequestException('Missing rtcUid for user — must join room first.');
  //   }

  //   const uidNum = parseInt(existingUid, 10);
  //   if (isNaN(uidNum)) {
  //     throw new BadRequestException('Invalid rtcUid stored in database.');
  //   }

  //   return uidNum;
  // }

  /**
   * Issue a token for Agora or Zego
   * Always reuse the same rtcUid
   */
  async issueToken(
    provider: Provider,
    roomId: string,
    role: 'publisher' | 'subscriber',
    rtcUid: number,
  ) {
    const expireSeconds = 3600;
    console.log('ISSUING RTC TOKEN', { provider, roomId, role, rtcUid });

    if (provider === 'AGORA') {
      const channelName = `room_${roomId}`;

      const { token, expiresAt } = this.agora.generateToken(
        channelName,
        rtcUid,
        role,
        expireSeconds,
      );

      return { provider, token, expiresAt, uid: rtcUid };
    }

    // ZEGO support (if used)
    const { token, expiresAt } = this.zego.generateToken(
      roomId,
      String(rtcUid),
      expireSeconds,
    );

    return { provider, token, expiresAt, uid: rtcUid };
  }

  // /**
  //  * Called when user toggles mic ON (publisher)
  //  */
  // async issuePublisherTokenForUser(roomId: string, userId: string) {
  //   const room = await this.prisma.audioRoom.findUnique({
  //     where: { id: roomId },
  //   });

  //   if (!room || !room.isLive) {
  //     throw new NotFoundException('Room not live');
  //   }

  //   const participant = await this.prisma.roomParticipant.findUnique({
  //     where: { roomId_userId: { roomId, userId } },
  //   });

  //   if (!participant?.rtcUid) {
  //     throw new BadRequestException('rtcUid missing — user must join room first.');
  //   }

  //   const rtcUid = this.ensureUid(participant.rtcUid);

  //   const tokenInfo = await this.issueToken(room.provider, roomId, 'publisher', rtcUid);

  //   // 🚫 Do NOT update rtcUid here — never mutate UID
  //   return { token: tokenInfo };
  // }

  // /**
  //  * Called when user toggles mic OFF (subscriber)
  //  */
  // async issueSubscriberTokenForUser(roomId: string, userId: string) {
  //   const room = await this.prisma.audioRoom.findUnique({
  //     where: { id: roomId },
  //   });

  //   if (!room) throw new NotFoundException('Room not found');

  //   const participant = await this.prisma.roomParticipant.findUnique({
  //     where: { roomId_userId: { roomId, userId } },
  //   });

  //   if (!participant?.rtcUid) {
  //     throw new BadRequestException('rtcUid missing — user must join room first.');
  //   }

  //   const rtcUid = this.ensureUid(participant.rtcUid);

  //   const tokenInfo = await this.issueToken(room.provider, roomId, 'subscriber', rtcUid);

  //   // 🚫 Do NOT update rtcUid for subscriber tokens either
  //   return { token: tokenInfo };
  // }

  async disconnectUser(provider: Provider, roomId: string, userId: string) {
    // Implement Agora/Zego kick if desired
    return true;
  }

  async disconnectRoom(provider: Provider, roomId: string) {
    // Optional: destroy room at provider
    return true;
  }
}
