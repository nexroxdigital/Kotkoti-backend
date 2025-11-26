import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class SocialService {
  constructor(private prisma: PrismaService) {}

  // Follow a user
  async followUser(userId: string, followerId: string) {
    // console.log('userid', followerId);

    if (userId === followerId) {
      throw new BadRequestException('You cannot follow yourself');
    }

    const existing = await this.prisma.follow.findUnique({
      where: { userId_followerId: { userId, followerId } },
    });

    if (existing) {
      throw new BadRequestException('Already following this user');
    }

    const follow = await this.prisma.follow.create({
      data: {
        userId,
        followerId,
      },
    });

    // trigger notifications later

    return follow;
  }

  // Unfollow a user
  async unfollowUser(userId: string, followerId: string) {
    const existing = await this.prisma.follow.findUnique({
      where: { userId_followerId: { userId, followerId } },
    });

    if (!existing) {
      throw new BadRequestException('You are not following this user');
    }

    const unfollowed = await this.prisma.follow.delete({
      where: { userId_followerId: { userId, followerId } },
    });

    return unfollowed;
  }

  // Get followers of a user
  async getFollowers(userId: string) {
    const followers = await this.prisma.follow.findMany({
      where: { userId },
      include: { follower: true },
    });
    return followers;
  }

  // Get following of a user
  async getFollowing(followerId: string) {
    const following = await this.prisma.follow.findMany({
      where: { followerId },
      include: { user: true },
    });
    return following;
  }
}
