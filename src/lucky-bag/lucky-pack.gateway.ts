import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { LuckyPackService } from './lucky-bag.service';

@WebSocketGateway({ cors: true })
export class LuckyPackGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly luckyPackService: LuckyPackService) {}

  // Notify room of a new lucky pack
  async notifyRoomLuckyPack(roomId: string, packData: any) {
    this.server.to(roomId).emit('NEW_LUCKY_PACK', packData);
  }

  // Listen for a user claiming a lucky pack
  @SubscribeMessage('CLAIM_LUCKY_PACK')
  async handleClaimLuckyPack(
    @MessageBody() data: { packId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const result = await this.luckyPackService.claimLuckyPack(
      data.packId,
      data.userId,
    );

    // Emit updated claim info to all participants in the room
    const roomId = result.roomId;
    this.server.to(roomId).emit('LUCKY_PACK_CLAIMED', result);
  }
}
