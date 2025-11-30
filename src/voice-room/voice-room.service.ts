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

  // create a new room by host
  async createRoom(hostId: string, roomName: string) {
    // 1. Create the room
    const room = await this.prisma.voiceRoom.create({
      data: {
        name: roomName,
        hostId,
      },
    });

    // 2. Create seats
    const totalSeats = Number(process.env.MAX_SEATS_PER_ROOM) || 12;
    const seatsData = Array.from({ length: totalSeats }).map((_, index) => ({
      roomId: room.id,
      seatNumber: index + 1,
      userId: index === 0 ? hostId : null,
      micOn: index === 0 ? true : false,
    }));
    await this.prisma.voiceRoomSeat.createMany({ data: seatsData });

    // 3. Fetch all seats to return
    const seats = await this.prisma.voiceRoomSeat.findMany({
      where: { roomId: room.id },
      orderBy: { seatNumber: 'asc' },
    });

    // 4. Generate Agora token for host
    const uid = Math.floor(Math.random() * 100000);
    const { token, expireSeconds } = this.agoraService.generateRtcToken(
      room.id,
      uid,
    );

    // 5. Add host as participant
    await this.prisma.voiceRoomParticipant.create({
      data: {
        roomId: room.id,
        userId: hostId,
        role: 'HOST',
        micOn: true,
      },
    });

    // 6. Log token
    await this.prisma.voiceRoomTokenLog.create({
      data: {
        roomId: room.id,
        userId: hostId,
        provider: 'AGORA',
        token,
        expireAt: new Date(Date.now() + expireSeconds * 1000),
      },
    });

    // 7. Return room info + host token
    return {
      room,
      seats,
      host: {
        uid,
        token,
        expireSeconds,
      },
    };
  }

  // join a new room by user
  /**
   * Join a room by a user.
   * Handles both locked and unlocked rooms.
   * For locked rooms, creates a join request.
   * For unlocked rooms, assigns seat and generates token immediately.
   */
  async joinRoom(userId: string, roomId: string) {
    // 1️⃣ Validate room exists
    const room = await this.prisma.voiceRoom.findUnique({
      where: { id: roomId },
      include: { seats: true, bans: true, participants: true },
    });
    if (!room) {
      throw new BadRequestException('Room does not exist');
    }

    // 2️⃣ Check if user is banned
    const isBanned = room.bans.some((ban) => ban.userId === userId);
    if (isBanned) {
      throw new ForbiddenException('You are banned from this room');
    }

    // 3️⃣ Check if user is already a participant
    const alreadyJoined = room.participants.some((p) => p.userId === userId);
    if (alreadyJoined) {
      throw new BadRequestException('You are already in the room');
    }

    // 4️⃣ Handle locked room
    if (room.locked) {
      // Locked room → create a join request for host approval
      const request = await this.prisma.voiceRoomSeatRequest.create({
        data: {
          roomId,
          userId,
          status: 'PENDING',
        },
      });

      // Return info for frontend / gateway to notify host
      return {
        action: 'REQUEST_REQUIRED',
        requestId: request.id,
      };
    }

    // 5️⃣ Unlocked room → join instantly
    // Find first available seat
    const availableSeat = room.seats.find(
      (seat) => !seat.userId && !seat.locked,
    );
    if (!availableSeat) {
      throw new BadRequestException('No available seats in the room');
    }

    // 6️⃣ Update seat assignment and mic status (mic ON for unlocked room)
    await this.prisma.voiceRoomSeat.update({
      where: { id: availableSeat.id },
      data: {
        userId,
        micOn: true,
      },
    });

    // 7️⃣ Create participant entry
    const participant = await this.prisma.voiceRoomParticipant.create({
      data: {
        roomId,
        userId,
        role: 'LISTENER', // default role for regular users
        micOn: true,
      },
    });

    // 8️⃣ Generate Agora token for this user
    const uid = Math.floor(Math.random() * 100000); // random uid for Agora
    const { token, expireSeconds } = this.agoraService.generateRtcToken(
      room.id,
      uid,
    );

    // 9️⃣ Log token in DB
    await this.prisma.voiceRoomTokenLog.create({
      data: {
        roomId,
        userId,
        provider: 'AGORA',
        token,
        expireAt: new Date(Date.now() + expireSeconds * 1000),
      },
    });

    // 🔟 Return all info needed for frontend
    return {
      action: 'JOIN_ALLOWED',
      participant: {
        id: participant.id,
        roomId: participant.roomId,
        userId: participant.userId,
        role: participant.role,
        micOn: participant.micOn,
        seatNumber: availableSeat.seatNumber,
      },
      token: {
        uid,
        token,
        expireSeconds,
      },
    };
  }

  /**
   * Approve a join request (for locked rooms)
   * Only host can call this
   */
  async approveJoinRequest(requestId: string, hostId: string) {
    // 1️⃣ Get request
    const request = await this.prisma.voiceRoomSeatRequest.findUnique({
      where: { id: requestId },
      include: { room: { include: { seats: true, host: true } } },
    });

    if (!request) {
      throw new BadRequestException('Join request not found');
    }

    const room = request.room;

    // 2️⃣ Check if the user approving is host
    if (room.hostId !== hostId) {
      throw new ForbiddenException('Only host can approve requests');
    }

    // 3️⃣ Find first available seat
    const availableSeat = room.seats.find(
      (seat) => !seat.userId && !seat.locked,
    );
    if (!availableSeat) {
      throw new BadRequestException('No available seats');
    }

    // 4️⃣ Update seat (mic OFF for locked room approval)
    await this.prisma.voiceRoomSeat.update({
      where: { id: availableSeat.id },
      data: {
        userId: request.userId,
        micOn: false,
      },
    });

    // 5️⃣ Create participant entry
    const participant = await this.prisma.voiceRoomParticipant.create({
      data: {
        roomId: room.id,
        userId: request.userId,
        role: 'LISTENER',
        micOn: false,
      },
    });

    // 6️⃣ Generate Agora token
    const uid = Math.floor(Math.random() * 100000);
    const { token, expireSeconds } = this.agoraService.generateRtcToken(
      room.id,
      uid,
    );

    // 7️⃣ Log token
    await this.prisma.voiceRoomTokenLog.create({
      data: {
        roomId: room.id,
        userId: request.userId,
        provider: 'AGORA',
        token,
        expireAt: new Date(Date.now() + expireSeconds * 1000),
      },
    });

    // 8️⃣ Delete the seat request
    await this.prisma.voiceRoomSeatRequest.delete({
      where: { id: requestId },
    });

    // 9️⃣ Return data for Gateway / frontend
    return {
      action: 'JOIN_APPROVED',
      participant: {
        id: participant.id,
        userId: participant.userId,
        roomId: participant.roomId,
        seatNumber: availableSeat.seatNumber,
        micOn: participant.micOn,
        role: participant.role,
      },
      token: { uid, token, expireSeconds },
    };
  }

  /**
   * Reject a join request (for locked rooms)
   */
  async rejectJoinRequest(requestId: string, hostId: string) {
    // 1️⃣ Get request
    const request = await this.prisma.voiceRoomSeatRequest.findUnique({
      where: { id: requestId },
      include: { room: true },
    });

    if (!request) {
      throw new BadRequestException('Join request not found');
    }

    const room = request.room;

    // 2️⃣ Only host can reject
    if (room.hostId !== hostId) {
      throw new ForbiddenException('Only host can reject requests');
    }

    // 3️⃣ Delete request
    await this.prisma.voiceRoomSeatRequest.delete({
      where: { id: requestId },
    });

    // 4️⃣ Return info for gateway/frontend
    return {
      action: 'JOIN_REJECTED',
      userId: request.userId,
      roomId: room.id,
    };
  }
}
