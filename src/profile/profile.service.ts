import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateMeDto } from './dto/update-me.dto';

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) {}

  // ----------------------------------
  // GET USER DATA
  // ----------------------------------

  async viewMe(userId: string, expandQuery?: string) {
    // ---- Parse expand options ----
    const expand = expandQuery
      ? expandQuery.split(',').map((x) => x.trim())
      : [];

    // ---- Build dynamic include object ----
    const include: any = {};

    if (expand.includes('agency')) include.agency = true;
    if (expand.includes('vip')) include.vip = true;
    if (expand.includes('charmLevel')) include.charmLevel = true;
    if (expand.includes('wealthLevel')) include.wealthLevel = true;

    // ---- Fetch user (exclude password) ----
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nickName: true,
        email: true,
        phone: true,
        profilePicture: true,
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

        ...include, // dynamic relations
      },
    });

    if (!user) throw new NotFoundException('User not found');

    // ---- Count Followers ----
    const followersCount = await (this.prisma as any).follow.count({
      where: { userId },
    });

    // ---- Count Friends ----
    const friendsCount = await (this.prisma as any).friends.count({
      where: {
        OR: [
          { requesterId: userId, status: 'ACCEPTED' },
          { receiverId: userId, status: 'ACCEPTED' },
        ],
      },
    });

    const visitorsCount = await (this.prisma as any).visitors.count({
      where: { userId },
    });

    // ---- Count Agency ----
    const agencyCount = user.agencyId ? 1 : 0;

    // ---- Build Final Response ----
    return {
      ...user,
      followersCount,
      friendsCount,
      agencyCount,
      visitorsCount,
    };
  }

    // ----------------------------------
  // PUBLIC PROFILE
  // ----------------------------------

  async getPublicProfile(userId: string) {
    // 1. Find user with safe public fields
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nickName: true,
        profilePicture: true,
        country: true,
        bio: true,
        isHost: true,

        // levels & vip
        charmLevel: {
          select: { id: true, name: true, imageUrl: true, levelup_point: true },
        },
        wealthLevel: {
          select: { id: true, name: true, imageUrl: true, levelup_point: true },
        },
        vip: {
          select: { id: true, name: true, imageUrl: true },
        },

        // agency (public data only)
        agency: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            country: true,
          },
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');

    // 2. Count followers
    const followersCount = await (this.prisma as any).follow.count({
      where: { userId },
    });

    // 3. Count friends
    const friendsCount = await (this.prisma as any).friends.count({
      where: {
        OR: [
          { requesterId: userId, status: 'ACCEPTED' },
          { receiverId: userId, status: 'ACCEPTED' },
        ],
      },
    });

    // 4. Build final public profile
    const publicProfile = {
      id: user.id,
      nickName: user.nickName,
      avatar: user.profilePicture,
      country: user.country,
      bio: user.bio,
      charmLevel: user.charmLevel,
      wealthLevel: user.wealthLevel,
      //vip: user.vip,
      followersCount,
      friendsCount,
      // agency: user.agency,
      isHost: user.isHost,
      isLive: false,
    };

    return { publicProfile };
  }

  // ----------------------------------
  // UPDATE MY PROFILE
  // ----------------------------------

  async updateMe(userId: string, dto: UpdateMeDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        nickName: dto.name ?? user.nickName,
        bio: dto.bio ?? user.bio,
        profilePicture: dto.profilePic ?? user.profilePicture,
        country: dto.country ?? user.country,
        dob: dto.dob ? new Date(dto.dob) : user.dob,
      },
      select: {
        id: true,
        nickName: true,
        profilePicture: true,
        bio: true,
        country: true,
        dob: true,
        gender: true,
        email: true,
        phone: true,
        updatedAt: true,
      },
    });

    return { user: updatedUser };
  }

  // ----------------------------------
  // BLOCK A USER
  // ----------------------------------

  async getBlockedUsers(userId: string, page = 1, limit = 10) {
    page = Number(page);
    limit = Number(limit);

    const skip = (page - 1) * limit;

    // Total count
    const total = await this.prisma.block.count({
      where: { blockerId: userId },
    });

    // Get blocked users + their public fields
    const items = await this.prisma.block.findMany({
      where: { blockerId: userId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        createdAt: true,
        blocked: {
          select: {
            id: true,
            nickName: true,
            profilePicture: true,
            country: true,
            bio: true,
            isHost: true,
            charmLevel: {
              select: { id: true, name: true, imageUrl: true },
            },
            wealthLevel: {
              select: { id: true, name: true, imageUrl: true },
            },
          },
        },
      },
    });

    return {
      items,
      total,
      page,
      limit,
    };
  }

  // ----------------------------------
  // UNBLOCK A USER
  // ----------------------------------

  async blockUser(blockerId: string, blockedId: string, reason?: string) {
  if (blockerId === blockedId) {
    throw new BadRequestException("You cannot block yourself");
  }

  // check if user exists
  const target = await this.prisma.user.findUnique({ where: { id: blockedId } });
  if (!target) throw new NotFoundException("User not found");

  // check if already blocked
  const existing = await this.prisma.block.findUnique({
    where: {
      blockerId_blockedId: {
        blockerId,
        blockedId,
      },
    },
  });

  if (existing) {
    return {
      message: "User already blocked",
      blockedUserId: blockedId,
    };
  }

  // create block
  await (this.prisma as any).block.create({
    data: {
      blockerId,
      blockedId,
      // optional: store reason into metadata in ActivityLog
    },
  });

  // optional: prevent follow record
  await this.prisma.follow.deleteMany({
    where: {
      OR: [
        { userId: blockerId, followerId: blockedId },
        { userId: blockedId, followerId: blockerId },
      ],
    },
  });

  // optional: delete friend relation
  await this.prisma.friends.deleteMany({
    where: {
      OR: [
        { requesterId: blockerId, receiverId: blockedId },
        { requesterId: blockedId, receiverId: blockerId },
      ],
    },
  });

  return {
    message: "User blocked successfully",
    blockedUserId: blockedId,
  };
}

async unblockUser(blockerId: string, blockedId: string) {
  const existing = await this.prisma.block.findUnique({
    where: {
      blockerId_blockedId: {
        blockerId,
        blockedId,
      },
    },
  });

  if (!existing) {
    return { message: "User is not blocked" };
  }

  await this.prisma.block.delete({
    where: {
      blockerId_blockedId: {
        blockerId,
        blockedId,
      },
    },
  });

  return { message: "User unblocked successfully" };
}

}
