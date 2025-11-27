import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class FriendsService {
  constructor(private prisma: PrismaService) {}

  async sendFriendRequest(senderId: string, receiverId: string) {
    if (senderId === receiverId) {
      throw new BadRequestException('You cannot friend yourself');
    }

    // 🔥 1 query: check both user existence and existing friendship together
    const [user, existing] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: receiverId },
        select: { id: true }, // only fetch what we need
      }),

      this.prisma.friends.findFirst({
        where: {
          OR: [
            { requesterId: senderId, receiverId },
            { requesterId: receiverId, receiverId: senderId },
          ],
        },
        select: {
          id: true,
          status: true,
        },
      }),
    ]);

    if (!user) throw new NotFoundException('User not found');

    // 2. Existing friend logic
    if (existing) {
      if (existing.status === 'PENDING') {
        throw new BadRequestException('Friend request already pending');
      }

      if (existing.status === 'ACCEPTED') {
        throw new BadRequestException('User is already your friend');
      }

      // Allow resend if REJECTED
      if (existing.status === 'REJECTED') {
        const updated = await this.prisma.friends.update({
          where: { id: existing.id },
          data: {
            requesterId: senderId,
            receiverId,
            status: 'PENDING',
          },
        });

        return {
          message: 'Friend request sent again',
          friendRequest: updated,
        };
      }
    }

    // 3. Create friend request
    const request = await this.prisma.friends.create({
      data: {
        requesterId: senderId,
        receiverId,
        status: 'PENDING',
      },
    });

    return {
      message: 'Friend request sent',
      friendRequest: request,
    };
  }

  async acceptFriendRequest(userId: string, friendId: string) {
    // 1. Find friend request
    const request = await this.prisma.friends.findUnique({
      where: { id: friendId },
    });

    if (!request) throw new NotFoundException('Friend request not found');

    // 2. Make sure YOU are receiver
    if (request.receiverId !== userId)
      throw new BadRequestException('You cannot accept this request');

    // 3. Must be pending
    if (request.status !== 'PENDING')
      throw new BadRequestException('Friend request already processed');

    // 4. Update status
    const updated = await this.prisma.friends.update({
      where: { id: friendId },
      data: { status: 'ACCEPTED' },
    });

    return {
      message: 'Friend request accepted',
      friend: updated,
    };
  }
}
