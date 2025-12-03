// src/gift/gift.gateway.ts
import { Injectable } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } })
@Injectable()
export class GiftGateway {
  @WebSocketServer()
  server: Server;

  // Emit gift event to a single user
  async sendGiftToUser(userId: string, payload: any) {
    this.server.to(`user:${userId}`).emit('GIFT_RECEIVED', payload);
  }
}
