import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';
import { ProfileService } from 'src/profile/profile.service';

type ChatMode = 'ALL' | 'SEAT_ONLY' | 'LOCKED';

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  constructor(
    private prisma: PrismaService,
    private profileService: ProfileService,
  ) {}

  // =====================================================
  // In-memory chat state (ephemeral)
  // =====================================================

  private announcedSockets = new Set<string>();

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

  // ============================
  // CLEANUP ON DISCONNECT
  // ============================
  handleDisconnect(client: Socket) {
    this.announcedSockets.delete(client.id);
  }

  @SubscribeMessage('room.ready')
  async onRoomReady(@ConnectedSocket() client: Socket) {
    const { userId, roomId } = client.handshake.query as any;
    if (!userId || !roomId) return;

    // HARD GUARD: prevent duplicate JOIN
    if (this.announcedSockets.has(client.id)) return;
    this.announcedSockets.add(client.id);

    const participant = await this.profileService.getUserById(userId);
    if (!participant) return;

    this.server.to(`room:${roomId}`).emit('chat:system', {
      type: 'JOIN',
      userId,
      nickName: participant.nickName,
      profilePicture: participant.profilePicture,
      message: `${participant.nickName} joined the room`,
      timestamp: Date.now(),
    });
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
    const participantWithUser = await this.prisma.roomParticipant.findFirst({
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
    console.log('mode', payload.mode);
    // (Host/Admin check already enforced)
    await this.prisma.audioRoom.update({
      where: { id: roomId },
      data: { chatMode: payload.mode },
    });

    this.server.to(`room:${roomId}`).emit('chat:modeChanged', {
      mode: payload.mode,
    });
  }

  // =====================================================
  // CLEAR CHAT (HOST / ADMIN)
  // =====================================================
  @SubscribeMessage('chat:clear')
  async handleClear(@ConnectedSocket() client: Socket) {
    const roomId = this.getRoomId(client);
    if (!roomId) return;

    this.server.to(`room:${roomId}`).emit('chat:cleared');
  }
}
