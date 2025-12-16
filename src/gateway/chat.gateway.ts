import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';
import { ParticipantsService } from '../participants/participants.service';

type ChatMode = 'ALL' | 'SEAT_ONLY' | 'LOCKED';

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  constructor(
    private prisma: PrismaService,
    private participantsService: ParticipantsService,
  ) {}

  // =====================================================
  // In-memory chat state (ephemeral)
  // =====================================================
  private roomChatState = new Map<
    string,
    { mode: ChatMode }
  >();

  private getState(roomId: string) {
    if (!this.roomChatState.has(roomId)) {
      this.roomChatState.set(roomId, { mode: 'ALL' });
    }
    return this.roomChatState.get(roomId)!;
  }

  // =====================================================
  // HELPERS
  // =====================================================
  private getRoomId(client: Socket): string | null {
    return (client.handshake.query?.roomId as string) ?? null;
  }

  private getUserId(client: Socket): string | null {
    return (client.handshake.query?.userId as string) ?? null;
  }

  private emitError(client: Socket, message: string) {
    client.emit('chat:error', { message });
  }

  // =====================================================
  // SEND MESSAGE
  // =====================================================
  @SubscribeMessage('chat:send')
  async handleSendMessage(
    @MessageBody() payload: { message: string },
    @ConnectedSocket() client: Socket,
  ) {
    const roomId = this.getRoomId(client);
    const userId = this.getUserId(client);

    if (!roomId || !userId) return;

    console.log('🔥 chat:send', { socketId: client.id, roomId, userId });

    const message = payload.message?.trim();
    if (!message) return;

  const room = await this.prisma.audioRoom.findUnique({
    where: { id: roomId },
    select: { chatMode: true },
  });

  if (!room) return;

  if (room.chatMode === 'LOCKED') {
    this.emitError(client, 'Chat is locked by host');
    return;
  }

  if (room.chatMode === 'SEAT_ONLY') {
    const seat = await this.prisma.seat.findFirst({
      where: { roomId, userId },
    });
    if (!seat) {
      this.emitError(client, 'Only seated users can chat');
      return;
    }
  }
    // ---- Participant check (DB) ----
  const participantWithUser =
  await this.prisma.roomParticipant.findFirst({
    where: { roomId, userId },
    include: {
      user: {
        select: {
          nickName: true,
          isHost: true,
          profilePicture: true,
          gender: true,
          email: true,
          dob: true,
          country: true,
          charmLevel: true,
          charmLevelId: true,
        },
      },
    },
  });

  const participant = participantWithUser?.user;

    if (!participant) return;

    // ---- Seat-only check ----
    if (room.chatMode === 'SEAT_ONLY') {
      const seat = await this.prisma.seat.findFirst({
        where: { roomId, userId },
      });

      if (!seat) {
        this.emitError(client, 'Only seated users can chat');
        return;
      }
    }

    // ---- Broadcast (NO STORAGE) ----
    this.server.to(`room:${roomId}`).emit('chat:message', {
      userId,
      role: participant.isHost ? 'HOST' : 'USER',
      nickName: participant.nickName,
      profilePicture: participant.profilePicture,
      gender: participant.gender,
      email: participant.email,
      dob: participant.dob,
      country: participant.country,
      charmLevel: participant.charmLevel,
      charmLevelId: participant.charmLevelId,
      message,
      timestamp: Date.now(),
    });
  }

  // =====================================================
  // CHANGE MODE (HOST / ADMIN)
  // =====================================================
@SubscribeMessage('chat:setMode')
async handleSetMode(
  @MessageBody() payload: { mode: ChatMode },
  @ConnectedSocket() client: Socket,
) {
  const roomId = this.getRoomId(client);
  if (!roomId) return;
console.log("mode", payload.mode)
  // (Host/Admin check already enforced)
  await this.prisma.audioRoom.update({
    where: { id: roomId },
    data: { chatMode: payload.mode },
  });

  this.server.to(`room:${roomId}`).emit('chat:modeChanged', {
    mode: payload.mode,
  });
}

@SubscribeMessage('chat:setMode')
async handleSetMod(
  @ConnectedSocket() client: Socket,
  @MessageBody() payload: { mode: 'ALL' | 'SEAT_ONLY' | 'LOCKED' },
) {
  const roomId = client.handshake.query.roomId as string;
  if (!roomId) return;

  const state = this.getState(roomId);
  state.mode = payload.mode;

  // 🔔 Notify everyone
  this.server.to(`room:${roomId}`).emit('chat:modeChanged', {
    mode: payload.mode,
    timestamp: Date.now(),
  });
}

  // =====================================================
  // CLEAR CHAT (HOST / ADMIN)
  // =====================================================
  @SubscribeMessage('chat:clear')
  async handleClear(
    @ConnectedSocket() client: Socket,
  ) {
    const roomId = this.getRoomId(client);
    if (!roomId) return;

    this.server.to(`room:${roomId}`).emit('chat:cleared');
  }
}
