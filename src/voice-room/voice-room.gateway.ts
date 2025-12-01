import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { VoiceRoomService } from './voice-room.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class VoiceRoomGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly voiceRoomService: VoiceRoomService,
    private readonly jwtService: JwtService,
  ) {}

  // Map to track connected users: userId -> socket.id
  private userSockets: Map<string, string> = new Map();

  // ----------------------
  // Socket connection events
  // ----------------------
  handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;
      if (!token) throw new Error('No token provided');

      // Verify JWT (use your AuthService or JWT library)
      const payload = this.jwtService.verify(token);
      const userId = payload.sub; // or however your JWT stores userId

      client.data.userId = userId;

      this.userSockets.set(userId, client.id);
      console.log(`User connected: ${userId} -> ${client.id}`);
    } catch (err) {
      console.log('Invalid JWT, disconnecting socket');
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const entry = [...this.userSockets.entries()].find(
      ([_, socketId]) => socketId === client.id,
    );
    if (entry) {
      const [userId] = entry;
      this.userSockets.delete(userId);
      console.log(`User disconnected: ${userId}`);
    }
  }

  // ----------------------
  // Helper functions
  // ----------------------
  getHostSocketId(hostId: string): string | undefined {
    return this.userSockets.get(hostId);
  }

  getUserSocketId(userId: string): string | undefined {
    return this.userSockets.get(userId);
  }

  getUserIdFromSocket(client: Socket): string | undefined {
    return client.data.userId;
  }

  /**
   * User clicks "Join Room"
   */
  // @SubscribeMessage('room.join')
  // async handleJoin(
  //   @MessageBody() data: { roomId: string },
  //   @ConnectedSocket() client: Socket,
  // ) {
  //   const userId = this.getUserIdFromSocket(client);

  //   if (!userId) {
  //     // Option 1: just return error
  //     client.emit('error', { message: 'Unauthorized socket connection' });
  //     return;
  //   }

  //   const result = await this.voiceRoomService.joinRoom(userId, data.roomId);

  //   if (result.action === 'REQUEST_REQUIRED') {
  //     // Notify the host of join request
  //     const roomHostSocketId = this.getHostSocketId(data.roomId);
  //     if (roomHostSocketId) {
  //       this.server.to(roomHostSocketId).emit('room.join.request', {
  //         requestId: result.requestId,
  //         userId: userId,
  //         roomId: data.roomId,
  //       });
  //     }
  //   } else if (result.action === 'JOIN_ALLOWED') {
  //     // Update all users in the room
  //     client.join(data.roomId);
  //     this.server.to(data.roomId).emit('room.user.joined', {
  //       participant: result.participant,
  //       token: result.token,
  //     });
  //   }

  //   return result;
  // }

  // /**
  //  * Host approves a join request
  //  */
  // @SubscribeMessage('room.join.approve')
  // async handleApprove(
  //   @MessageBody() data: { requestId: string },
  //   @ConnectedSocket() client: Socket,
  // ) {
  //   const hostId = this.getUserIdFromSocket(client);

  //   if (!hostId) {
  //     client.emit('error', { message: 'Unauthorized socket connection' });
  //     return;
  //   }

  //   const result = await this.voiceRoomService.approveJoinRequest(
  //     data.requestId,
  //     hostId,
  //   );

  //   // Notify the user who requested
  //   const userSocketId = this.getUserSocketId(result.participant.userId);
  //   if (userSocketId) {
  //     this.server.to(userSocketId).emit('room.join.approved', result);
  //   }

  //   // Notify all in room about seat update
  //   this.server.to(result.participant.roomId).emit('room.user.joined', {
  //     participant: result.participant,
  //     token: result.token,
  //   });
  // }

  // /**
  //  * Host rejects a join request
  //  */
  // @SubscribeMessage('room.join.reject')
  // async handleReject(
  //   @MessageBody() data: { requestId: string; hostId: string },
  //   @ConnectedSocket() client: Socket,
  // ) {
  //   const hostId = this.getUserIdFromSocket(client);

  //   if (!hostId) {
  //     client.emit('error', { message: 'Unauthorized socket connection' });
  //     return;
  //   }

  //   const result = await this.voiceRoomService.rejectJoinRequest(
  //     data.requestId,
  //     hostId,
  //   );

  //   // Notify the user
  //   const userSocketId = this.getUserSocketId(result.userId);
  //   if (userSocketId) {
  //     this.server.to(userSocketId).emit('room.join.rejected', result);
  //   }
  // }
}
