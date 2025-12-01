import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { AgoraService } from 'src/agora/agora.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class VoiceRoomService {
  constructor(
    private prisma: PrismaService,
    private agoraService: AgoraService,
  ) {}

  // // ✅ CREATE ROOM
  // async createRoom(hostId: string, roomName: string) {
  //   // 1. Create room
  //   const room = await this.prisma.audioRoom.create({
  //     data: {
  //       name: roomName,
  //       hostId,
  //     },
  //   });

  //   // 2. Create seats
  //   const totalSeats = Number(process.env.MAX_SEATS_PER_ROOM) || 12;

  //   const seatsData = Array.from({ length: totalSeats }).map((_, index) => ({
  //     roomId: room.id,
  //     index: index + 1,
  //     userId: index === 0 ? hostId : null,
  //     micOn: index === 0,
  //   }));

  //   await this.prisma.seat.createMany({ data: seatsData });

  //   // 3. Load seats
  //   const seats = await this.prisma.seat.findMany({
  //     where: { roomId: room.id },
  //     orderBy: { index: 'asc' },
  //   });

  //   // 4. Generate Agora token
  //   const uid = Math.floor(Math.random() * 100000);
  //   const { token, expireSeconds } = this.agoraService.generateRtcToken(
  //     room.id,
  //     uid,
  //   );

  //   // 5. Add host as participant
  //   await this.prisma.roomParticipant.create({
  //     data: {
  //       roomId: room.id,
  //       userId: hostId,
  //       isHost: true,
  //       muted: false,
  //     },
  //   });

  //   // 6. Log token
  //   await this.prisma.providerTokenLog.create({
  //     data: {
  //       roomId: room.id,
  //       userId: hostId,
  //       provider: 'AGORA',
  //       token,
  //       expiresAt: new Date(Date.now() + expireSeconds * 1000),
  //     },
  //   });

  //   return { room, seats, uid, token, expireSeconds };
  // }

  // // ✅ JOIN ROOM
  // async joinRoom(userId: string, roomId: string) {
  //   const room = await this.prisma.audioRoom.findUnique({
  //     where: { id: roomId },
  //     include: { seats: true, bans: true, participants: true },
  //   });

  //   if (!room) throw new BadRequestException('Room not found');

  //   // Check ban
  //   if (room.bans.some((b) => b.userId === userId)) {
  //     throw new ForbiddenException('You are banned from this room');
  //   }

  //   // Check already joined
  //   if (room.participants.some((p) => p.userId === userId)) {
  //     throw new BadRequestException('Already joined');
  //   }

  //   // Find free seat
  //   const seat = room.seats.find((s) => !s.userId && !s.locked);
  //   if (!seat) throw new BadRequestException('No free seat available');

  //   // Assign seat
  //   await this.prisma.seat.update({
  //     where: { id: seat.id },
  //     data: { userId, micOn: true },
  //   });

  //   const participant = await this.prisma.roomParticipant.create({
  //     data: {
  //       roomId,
  //       userId,
  //       isHost: false,
  //       muted: false,
  //     },
  //   });

  //   // Generate Agora token
  //   const uid = Math.floor(Math.random() * 100000);
  //   const { token, expireSeconds } = this.agoraService.generateRtcToken(
  //     room.id,
  //     uid,
  //   );

  //   // Log token
  //   await this.prisma.providerTokenLog.create({
  //     data: {
  //       roomId,
  //       userId,
  //       provider: 'AGORA',
  //       token,
  //       expiresAt: new Date(Date.now() + expireSeconds * 1000),
  //     },
  //   });

  //   return {
  //     participantId: participant.id,
  //     seatIndex: seat.index,
  //     token,
  //     uid,
  //     expireSeconds,
  //   };
  // }

  // // ✅ REQUEST SEAT
  // async requestSeat(userId: string, roomId: string, seatIndex?: number) {
  //   return this.prisma.seatRequest.create({
  //     data: {
  //       userId,
  //       roomId,
  //       seatIndex,
  //     },
  //   });
  // }

  // // ✅ APPROVE REQUEST
  // async approveSeatRequest(requestId: string, hostId: string) {
  //   const request = await this.prisma.seatRequest.findUnique({
  //     where: { id: requestId },
  //     include: { room: { include: { seats: true } } },
  //   });

  //   if (!request) throw new BadRequestException('Request not found');
  //   if (request.room.hostId !== hostId) {
  //     throw new ForbiddenException('Only host can approve');
  //   }

  //   const seat = request.room.seats.find(
  //     (s) =>
  //       !s.userId &&
  //       !s.locked &&
  //       (!request.seatIndex || s.index === request.seatIndex),
  //   );

  //   if (!seat) throw new BadRequestException('No seat available');

  //   await this.prisma.seat.update({
  //     where: { id: seat.id },
  //     data: { userId: request.userId, micOn: false },
  //   });

  //   const participant = await this.prisma.roomParticipant.create({
  //     data: {
  //       roomId: request.roomId,
  //       userId: request.userId,
  //     },
  //   });

  //   const uid = Math.floor(Math.random() * 100000);
  //   const { token, expireSeconds } = this.agoraService.generateRtcToken(
  //     request.roomId,
  //     uid,
  //   );

  //   await this.prisma.providerTokenLog.create({
  //     data: {
  //       roomId: request.roomId,
  //       userId: request.userId,
  //       provider: 'AGORA',
  //       token,
  //       expiresAt: new Date(Date.now() + expireSeconds * 1000),
  //     },
  //   });

  //   await this.prisma.seatRequest.delete({ where: { id: requestId } });

  //   return {
  //     seat: seat.index,
  //     uid,
  //     token,
  //     expireSeconds,
  //     participantId: participant.id,
  //   };
  // }

  // // ✅ REJECT REQUEST
  // async rejectSeatRequest(requestId: string, hostId: string) {
  //   const request = await this.prisma.seatRequest.findUnique({
  //     where: { id: requestId },
  //     include: { room: true },
  //   });

  //   if (!request) throw new BadRequestException('Request not found');
  //   if (request.room.hostId !== hostId) {
  //     throw new ForbiddenException('Only host can reject');
  //   }

  //   await this.prisma.seatRequest.delete({ where: { id: requestId } });

  //   return {
  //     rejectedUserId: request.userId,
  //     roomId: request.roomId,
  //   };
  // }
}
