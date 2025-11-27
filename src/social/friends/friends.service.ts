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

  async cancelFriendRequest(userId: string, friendId: string) {
    const request = await this.prisma.friends.findUnique({
      where: { id: friendId },
    });

    if (!request) throw new NotFoundException('Friend request not found');

    // Only sender can cancel
    if (request.requesterId !== userId)
      throw new BadRequestException('Cannot cancel a request you did not send');

    // Must still be pending
    if (request.status !== 'PENDING')
      throw new BadRequestException('Request already processed');

    await this.prisma.friends.delete({
      where: { id: friendId },
    });

    return { message: 'Friend sent request cancelled' };
  }

  async rejectFriendRequest(userId: string, friendId: string) {
    // 1. Find request
    const request = await this.prisma.friends.findUnique({
      where: { id: friendId },
    });

    if (!request) throw new NotFoundException('Friend request not found');

    // 2. Must be receiver
    if (request.receiverId !== userId)
      throw new BadRequestException('You cannot reject this request');

    // 3. If not pending → invalid
    if (request.status !== 'PENDING')
      throw new BadRequestException('Request already processed');

    // OPTION A: Keep record and mark rejected
    await this.prisma.friends.update({
      where: { id: friendId },
      data: { status: 'REJECTED' },
    });

    return { message: 'Friend request rejected' };

    // ------------------------------------
    // OPTION B (alternative): delete record
    // ------------------------------------
    // await this.prisma.friends.delete({ where: { id: friendId } });
    // return { message: 'Friend request rejected' };
  }

  async removeFriend(userId: string, friendId: string) {
    const friendship = await this.prisma.friends.findUnique({
      where: { id: friendId },
    });

    if (!friendship) throw new NotFoundException('Friend not found');

    // Must belong to user
    if (friendship.requesterId !== userId && friendship.receiverId !== userId) {
      throw new BadRequestException('No rights to remove this friend');
    }

    // Must be accepted
    if (friendship.status !== 'ACCEPTED') {
      throw new BadRequestException('This user is not your friend');
    }

    await this.prisma.friends.delete({
      where: { id: friendId },
    });

    return { message: 'Friend removed successfully' };
  }

  async listFriends(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      // fetch accepted friendships
      this.prisma.friends.findMany({
        where: {
          status: 'ACCEPTED',
          OR: [{ requesterId: userId }, { receiverId: userId }],
        },
        include: {
          requester: {
            select: {
              id: true,
              nickName: true,
              profilePicture: true,
              country: true,
            },
          },
          receiver: {
            select: {
              id: true,
              nickName: true,
              profilePicture: true,
              country: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
      }),

      // count total
      this.prisma.friends.count({
        where: {
          status: 'ACCEPTED',
          OR: [{ requesterId: userId }, { receiverId: userId }],
        },
      }),
    ]);

    // normalize output: always return "friend" as the other person
    const friends = items.map((row) => {
      const friend = row.requesterId === userId ? row.receiver : row.requester;

      return {
        id: row.id,
        friendId: friend.id,
        name: friend.nickName,
        avatar: friend.profilePicture,
        country: friend.country,
        since: row.updatedAt,
      };
    });

    return {
      items: friends,
      total,
      page,
      limit,
    };
  }

  async listSentRequests(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.friends.findMany({
        where: {
          requesterId: userId,
          status: 'PENDING',
        },
        include: {
          receiver: {
            select: {
              id: true,
              nickName: true,
              profilePicture: true,
              country: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),

      this.prisma.friends.count({
        where: {
          requesterId: userId,
          status: 'PENDING',
        },
      }),
    ]);

    const results = items.map((row) => ({
      id: row.id,
      targetUser: {
        id: row.receiver.id,
        name: row.receiver.nickName,
        avatar: row.receiver.profilePicture,
        country: row.receiver.country,
      },
      status: row.status,
      sentAt: row.createdAt,
    }));

    return {
      items: results,
      total,
      page,
      limit,
    };
  }

  async listReceivedRequests(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.friends.findMany({
        where: {
          receiverId: userId,
          status: 'PENDING',
        },
        include: {
          requester: {
            select: {
              id: true,
              nickName: true,
              profilePicture: true,
              country: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),

      this.prisma.friends.count({
        where: {
          receiverId: userId,
          status: 'PENDING',
        },
      }),
    ]);

    const results = items.map((row) => ({
      id: row.id,
      fromUser: {
        id: row.requester.id,
        name: row.requester.nickName,
        avatar: row.requester.profilePicture,
        country: row.requester.country,
      },
      status: row.status,
      receivedAt: row.createdAt,
    }));

    return {
      items: results,
      total,
      page,
      limit,
    };
  }

  async getMutualFriends(myId: string, otherUserId: string) {
    if (myId === otherUserId) {
      throw new BadRequestException('Cannot get mutual friends with yourself');
    }

    // 1. Fetch my friends
    const myFriends = await this.prisma.friends.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [{ requesterId: myId }, { receiverId: myId }],
      },
    });

    // Extract my friend IDs
    const myFriendIds = myFriends.map((f) =>
      f.requesterId === myId ? f.receiverId : f.requesterId,
    );

    // 2. Fetch target user's friends
    const otherFriends = await this.prisma.friends.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [{ requesterId: otherUserId }, { receiverId: otherUserId }],
      },
    });

    const otherFriendIds = otherFriends.map((f) =>
      f.requesterId === otherUserId ? f.receiverId : f.requesterId,
    );

    // 3. Find intersection
    const mutualIds = myFriendIds.filter((id) => otherFriendIds.includes(id));

    if (mutualIds.length === 0) {
      return {
        total: 0,
        items: [],
      };
    }

    // 4. Fetch public info of mutual friends
    const users = await this.prisma.user.findMany({
      where: { id: { in: mutualIds } },
      select: {
        id: true,
        nickName: true,
        profilePicture: true,
        country: true,
      },
    });

    return {
      total: users.length,
      items: users.map((u) => ({
        id: u.id,
        name: u.nickName,
        avatar: u.profilePicture,
        country: u.country,
      })),
    };
  }

  async getFriendCounts(userId: string) {
    const [totalFriends, pendingSent, pendingReceived] = await Promise.all([
      // Count accepted friends
      this.prisma.friends.count({
        where: {
          status: 'ACCEPTED',
          OR: [{ requesterId: userId }, { receiverId: userId }],
        },
      }),

      // Sent requests (pending)
      this.prisma.friends.count({
        where: {
          requesterId: userId,
          status: 'PENDING',
        },
      }),

      // Received requests (pending)
      this.prisma.friends.count({
        where: {
          receiverId: userId,
          status: 'PENDING',
        },
      }),
    ]);

    return {
      totalFriends,
      pendingSent,
      pendingReceived,
    };
  }
}
