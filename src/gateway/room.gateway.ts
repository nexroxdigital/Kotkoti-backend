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

  @SubscribeMessage('room.join')
  async onRoomJoin(
    @MessageBody() payload: { roomId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { roomId, userId } = payload;
    client.join(`room:${roomId}`);
    await this.participantsService.add(roomId, userId, client.id);
    const participants = await this.participantsService.getActive(roomId);
    this.server.to(`room:${roomId}`).emit('room.join', { userId, participants });
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
    this.server.to(`room:${roomId}`).emit('room.leave', { userId, participants });
  }

  @SubscribeMessage('seat.request')
  async onSeatRequest(
    @MessageBody() payload: { roomId: string; userId: string; seatIndex?: number },
  ) {
    const req = await this.seatsService.requestSeat(
      payload.roomId,
      payload.userId,
      payload.seatIndex,
    );
    this.server.to(`room:${payload.roomId}`).emit('seat.request', { request: req });
  }

  @SubscribeMessage('seat.mute')
  async onSeatMute(@MessageBody() payload: { roomId: string; seatIndex: number }) {
    await this.seatsService.muteSeat(payload.roomId, payload.seatIndex);
    this.server.to(`room:${payload.roomId}`).emit('seat.mute', payload);
  }

  @SubscribeMessage('seat.kick')
  async onSeatKick(@MessageBody() payload: { roomId: string; seatIndex: number }) {
    await this.seatsService.kickSeat(payload.roomId, payload.seatIndex);
    this.server.to(`room:${payload.roomId}`).emit('seat.kick', payload);
  }

  @SubscribeMessage('seat.lock')
  async onSeatLock(@MessageBody() payload: { roomId: string; seatIndex: number }) {
    await this.seatsService.lockSeat(payload.roomId, payload.seatIndex, true);
    this.server.to(`room:${payload.roomId}`).emit('seat.lock', payload);
  }

  @SubscribeMessage('seat.unlock')
  async onSeatUnlock(@MessageBody() payload: { roomId: string; seatIndex: number }) {
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
