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
import { SeatsService } from '../seats/seats.service';
import { PrismaService } from '../prisma/prisma.service';
import { ProfileService } from '../profile/profile.service';

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/' })
export class RoomGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private participantsService: ParticipantsService,
    private seatsService: SeatsService,
    private prisma: PrismaService,
    private profileService: ProfileService,
  ) {
    console.log('✅ RoomGateway initialized');
  }

  // =====================================================
  // 🔌 CONNECTION (JOIN SOCKET)
  // =====================================================
  async handleConnection(client: Socket) {
    const { userId, roomId } = client.handshake.query as any;

    console.log('🔌 Socket connected:', client.id, userId, roomId);

    if (!userId || !roomId) return;

    // -----------------------------------------------------
    // 🔥 24-HOUR BAN ENFORCEMENT
    // -----------------------------------------------------
    const kick = await this.prisma.audioRoomKick.findUnique({
      where: { roomId_userId: { roomId, userId } },
    });

    if (kick && kick.expiresAt > new Date()) {
      console.log('⛔ Blocked banned user:', userId);

      // Notify front-end
      client.emit('user.kicked', { userId });

      // Disconnect immediately
      client.disconnect(true);
      return;
    }

    // If ban expired, auto cleanup
    if (kick && kick.expiresAt <= new Date()) {
      await this.prisma.audioRoomKick.delete({
        where: { roomId_userId: { roomId, userId } },
      });
    }

    // -----------------------------------------------------
    // NORMAL CONNECTION
    // -----------------------------------------------------
    client.join(`user:${userId}`);
    client.join(`room:${roomId}`);
  }

  // =====================================================
  // 🔌 DISCONNECT CLEANUP
  // =====================================================
  async handleDisconnect(client: Socket) {
    const { userId, roomId } = client.handshake.query as any;

    console.log('❌ Socket disconnected:', client.id, userId, roomId);

    if (!userId || !roomId) return;

    // Remove from seat
    const res = await this.seatsService.leaveSeatSilent(roomId, userId);

    // Remove from participants table
    await this.participantsService.remove(roomId, userId);

    // Update seats
    if (res?.seats) {
      this.server.to(`room:${roomId}`).emit('seat.update', {
        seats: res.seats,
      });
    }

    // Update participants
    const participants = await this.participantsService.getActive(roomId);
    this.server.to(`room:${roomId}`).emit('room.leave', {
      userId,
      participants,
    });
  }

  // Helper
  private async userHasSeat(roomId: string, userId: string) {
    return !!(await this.prisma.seat.findFirst({
      where: { roomId, userId },
    }));
  }

  // =====================================================
  // ROOM JOIN / LEAVE MESSAGES
  // =====================================================
  @SubscribeMessage('room.join')
  async onRoomJoin(
    @MessageBody() payload: { roomId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { roomId, userId } = payload;

    // 1️⃣ Join socket rooms FIRST
    client.join(`user:${userId}`);
    client.join(`room:${roomId}`);

    // 2️⃣ Fetch FULL updated participants list
    const participants = await this.participantsService.getActive(roomId);

    // 3️⃣ Emit FULL authoritative state (previous + new)
    this.server.to(`room:${roomId}`).emit('participant.update', {
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

  @SubscribeMessage('seat.invite')
  async onSeatInvite(
    @MessageBody()
    payload: {
      roomId: string;
      seatIndex: number;
      targetUserId: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    const { roomId, seatIndex, targetUserId } = payload;

    // Send invite ONLY to target user
    this.server.to(`user:${targetUserId}`).emit('seat.invited', {
      roomId,
      seatIndex,
    });
  }

  @SubscribeMessage('seat.invite.accept')
  async onInviteAccept(
    @MessageBody()
    payload: {
      roomId: string;
      seatIndex: number;
      userId: string;
    },
  ) {
    const { roomId, seatIndex, userId } = payload;
    console.log('seat-invite-payload', payload);
    // Use existing seat service logic
    const seats = await this.seatsService.takeSeat(roomId, seatIndex, userId);

    // Broadcast updated seats
    this.server.to(`room:${roomId}`).emit('seat.update', { seats });
  }

  @SubscribeMessage('seat.invite.reject')
  handleInviteReject(
    @MessageBody()
    payload: {
      roomId: string;
      seatIndex: number;
      userId: string;
    },
  ) {
    console.log('seat-reject-payload', payload);
    this.server
      .to(`room:${payload.roomId}`)
      .emit('seat.invite.reject', payload);
  }

  // =====================================================
  // MIC STATUS
  // =====================================================

  @SubscribeMessage('user.micOn')
  async onMicOn(@MessageBody() payload: { roomId: string; userId: string }) {
    const allowed = await this.userHasSeat(payload.roomId, payload.userId);
    if (!allowed) return;

    this.server.to(`room:${payload.roomId}`).emit('user.micOn', payload);
  }

  @SubscribeMessage('user.micOff')
  async onMicOff(@MessageBody() payload: { roomId: string; userId: string }) {
    const allowed = await this.userHasSeat(payload.roomId, payload.userId);
    if (!allowed) return;

    this.server.to(`room:${payload.roomId}`).emit('user.micOff', payload);
  }

  // =====================================================
  // SERVER-ONLY EMITS (CONTROLLER → WS)
  // =====================================================
  broadcastSeatUpdate(roomId: string, seats: any[]) {
    this.server.to(`room:${roomId}`).emit('seat.update', { seats });
  }


  async emitSeatRequests(roomId: string) {
  const requests = await this.prisma.seatRequest.findMany({
    where: {
      roomId,
      status: 'PENDING',
    },
    orderBy: { createdAt: 'asc' },
    include: {
      user: {
   select: {
            id: true,
            nickName: true,
            email: true,
            phone: true,
            profilePicture: true,
            coverImage: true,
            roleId: true,
            dob: true,
            bio: true,
            gender: true,
            country: true,
            gold: true,
            diamond: true,
            isDiamondBlocked: true,
            isGoldBlocked: true,
            isAccountBlocked: true,
            isHost: true,
            isReseller: true,
            agencyId: true,
            vipId: true,
            charmLevel: true,
            wealthLevel: true,
            createdAt: true,
            updatedAt: true,
            activeItem: {
              select: {
                id: true,
                name: true,
                icon: true,
                swf: true,
              },
            },
          },
      },
    },
  });

  // emit ONLY to host
  await this.emitToHost(roomId, 'seat.requests', {
    requests,
  });
}


  async emitToHost(roomId: string, event: string, payload: any) {
    const room = await this.participantsService.getRoomWithHost(roomId);
    if (!room) return;

    this.server.to(`user:${room.hostId}`).emit(event, payload);
  }

  emitSeatMute(roomId: string, seatIndex: number, mute: boolean) {
    this.server.to(`room:${roomId}`).emit('seat.muted', { seatIndex, mute });
  }

  // =====================================================
  // PARTICIPANT UPDATE BROADCAST
  // =====================================================
  async broadcastParticipants(roomId: string) {
    const participants = await this.participantsService.getActive(roomId);

    this.server.to(`room:${roomId}`).emit('participant.update', {
      participants,
    });
  }

  // =====================================================
  // KICK EVENT EMIT
  // =====================================================
  emitUserKicked(roomId: string, userId: string) {
    this.server.to(`room:${roomId}`).emit('user.kicked', { userId });
  }
}
