import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ParticipantsService } from '../participants/participants.service';
import { SeatsService } from 'src/seats/seats.service';

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/' })
export class RoomGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private seatsService: SeatsService,
    private participantsService: ParticipantsService,
  ) {}

  async handleConnection(client: Socket) {
    // Optional auth here using query or headers
  }

  async handleDisconnect(client: Socket) {
    // cleanup if you want by tracking client id -> user id
  }

  private async emitToHost(roomId: string, event: string, payload: any) {
    const room = await this.participantsService.getRoomWithHost(roomId);

    const userRoom = `user:${room.hostId}`;

    const adapter = (this.server as any).adapter;
    const roomsMap = adapter.rooms;
    const hostSockets = roomsMap.get(userRoom);

    console.log('🔔 EMIT TO HOST ROOM:', userRoom);
    console.log(
      '🎯 SOCKETS FOUND:',
      hostSockets?.size || hostSockets?.length || 0,
    );

    if (!hostSockets) {
      console.log('❌ NO HOST SOCKET FOUND');
      return;
    }

    // SUPPORT SET OR ARRAY (DIFFERENT SOCKET.IO VERSIONS)
    const socketIds = Array.isArray(hostSockets)
      ? hostSockets
      : Array.from(hostSockets);

    for (const socketId of socketIds) {
      this.server.to(socketId).emit(event, payload);
    }
  }

  @SubscribeMessage('room.join')
  async onRoomJoin(
    @MessageBody() payload: { roomId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { roomId, userId } = payload;

    client.join(`room:${roomId}`);
    client.join(`user:${userId}`);
    console.log('ROOM:', roomId);
    console.log('USER ROOM:', `user:${userId}`);
    console.log('SOCKET ROOMS:', [...client.rooms]);

    const participants = await this.participantsService.getActive(roomId);

    this.server
      .to(`room:${roomId}`)
      .emit('room.join', { userId, participants });
  }

  @SubscribeMessage('room.leave')
  async onRoomLeave(
    @MessageBody() payload: { roomId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { roomId, userId } = payload;
    client.leave(`room:${roomId}`);
    await this.participantsService.remove(roomId, userId);
    const participants = await this.participantsService.getActive(roomId);
    this.server
      .to(`room:${roomId}`)
      .emit('room.leave', { userId, participants });
  }

  @SubscribeMessage('seat.request')
  async onSeatRequest(
    @MessageBody()
    payload: { roomId: string; userId: string; seatIndex?: number },
    @ConnectedSocket() client: Socket,
  ) {
    console.log('WS seat.request received:', payload);

    // Only broadcast – DB already done by REST
    await this.emitToHost(payload.roomId, 'seat.request', {
      request: payload,
    });
  }

  @SubscribeMessage('seat.mute')
  async onSeatMute(
    @MessageBody() payload: { roomId: string; seatIndex: number },
  ) {
    await this.seatsService.muteSeat(payload.roomId, payload.seatIndex);
    this.server.to(`room:${payload.roomId}`).emit('seat.mute', payload);
  }

  @SubscribeMessage('seat.kick')
  async onSeatKick(
    @MessageBody() payload: { roomId: string; seatIndex: number },
  ) {
    await this.seatsService.kickSeat(payload.roomId, payload.seatIndex);
    this.server.to(`room:${payload.roomId}`).emit('seat.kick', payload);
  }

  @SubscribeMessage('seat.lock')
  async onSeatLock(
    @MessageBody() payload: { roomId: string; seatIndex: number },
  ) {
    await this.seatsService.lockSeat(payload.roomId, payload.seatIndex, true);
    this.server.to(`room:${payload.roomId}`).emit('seat.lock', payload);
  }

  @SubscribeMessage('seat.unlock')
  async onSeatUnlock(
    @MessageBody() payload: { roomId: string; seatIndex: number },
  ) {
    await this.seatsService.lockSeat(payload.roomId, payload.seatIndex, false);
    this.server.to(`room:${payload.roomId}`).emit('seat.unlock', payload);
  }

  @SubscribeMessage('user.micOn')
  async onMicOn(@MessageBody() payload: { roomId: string; userId: string }) {
    await this.seatsService.toggleMic(payload.roomId, payload.userId, true);
    this.server.to(`room:${payload.roomId}`).emit('user.micOn', payload);
  }

  @SubscribeMessage('user.micOff')
  async onMicOff(@MessageBody() payload: { roomId: string; userId: string }) {
    await this.seatsService.toggleMic(payload.roomId, payload.userId, false);
    this.server.to(`room:${payload.roomId}`).emit('user.micOff', payload);
  }
}
