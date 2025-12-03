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
    private participantsService: ParticipantsService,
    private seatsService: SeatsService,
  ) {
    console.log('✅ RoomGateway initialized');
  }

  // =====================================================
  // 🔌 CONNECTION HANDLERS
  // =====================================================

  async handleConnection(client: Socket) {
    const { userId } = client.handshake.query;
    if (userId) {
      client.join(`user:${userId}`);
    }
    console.log('🔌 Socket connected:', client.id);
  }

  async handleDisconnect(client: Socket) {
    console.log('❌ Socket disconnected:', client.id);

    // Optional: cleanup if needed
    // Example: remove participant if you store mapping socket -> user
  }

  private async userHasSeat(roomId: string, userId: string) {
    return !!(await this.seatsService['prisma'].seat.findFirst({
      where: { roomId, userId },
    }));
  }

  // =====================================================
  // ROOM JOIN / LEAVE (PRESENCE)
  // =====================================================

  @SubscribeMessage('room.join')
  async onRoomJoin(
    @MessageBody() payload: { roomId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { roomId, userId } = payload;

    client.join(`room:${roomId}`);
    client.join(`user:${userId}`);

    console.log('ROOM JOIN:', roomId, userId);

    const participants = await this.participantsService.getActive(roomId);

    this.server.to(`room:${roomId}`).emit('room.join', {
      userId,
      participants,
    });
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

    this.server.to(`room:${roomId}`).emit('room.leave', {
      userId,
      participants,
    });
  }

  // =====================================================
  // MIC STATUS (UI STATE ONLY)
  // =====================================================

  @SubscribeMessage('user.micOn')
  async onMicOn(@MessageBody() payload: { roomId: string; userId: string }) {
    const allowed = await this.userHasSeat(payload.roomId, payload.userId);
    if (!allowed) {
      console.log('micOn blocked, user has no seat', payload);
      return;
    }
    this.server.to(`room:${payload.roomId}`).emit('user.micOn', payload);
  }

  @SubscribeMessage('user.micOff')
  async onMicOff(@MessageBody() payload: { roomId: string; userId: string }) {
    const allowed = await this.userHasSeat(payload.roomId, payload.userId);
    if (!allowed) {
      console.log('micOff blocked, user has no seat', payload);
      return;
    }
    this.server.to(`room:${payload.roomId}`).emit('user.micOff', payload);
  }

  // =====================================================
  // SERVER-ONLY EMITS (CONTROLLER CALLS THESE)
  // =====================================================

  // Emit seat request to host after DB commit
  emitSeatRequest(roomId: string, request: any) {
    this.emitToHost(roomId, 'seat.request', { request });
  }

  // Broadcast updated seats after approve/deny/leave/kick
  broadcastSeatUpdate(roomId: string, seats: any[]) {
    this.server.to(`room:${roomId}`).emit('seat.update', { seats });
  }

  // Host-only room
  async emitToHost(roomId: string, event: string, payload: any) {
    const room = await this.participantsService.getRoomWithHost(roomId);
    if (!room) return;

    this.server.to(`user:${room.hostId}`).emit(event, payload);
  }
}
