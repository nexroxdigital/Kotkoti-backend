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
import { join } from 'path';
import * as fs from 'fs';
import sharp from 'sharp';
import {
  countryCodeToFlag,
  normalizeCountry,
} from 'src/common/utils/country.util';

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) {}

  // ----------------------------------
  // GET USER DATA
  // ----------------------------------

  async viewMe(userId: string, expandQuery?: string) {
    const expand = expandQuery
      ? expandQuery.split(',').map((x) => x.trim())
      : [];

    // Base select
    const baseSelect = {
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
    };

    const relationSelect: Record<string, true> = {};
    if (expand.includes('agency')) relationSelect.agency = true;
    if (expand.includes('vip')) relationSelect.vip = true;
    if (expand.includes('charmLevel')) relationSelect.charmLevel = true;
    if (expand.includes('wealthLevel')) relationSelect.wealthLevel = true;

    // Run ALL queries at once
    const [user, followersCount, followingCount, friendsCount, visitorsCount] =
      await Promise.all([
        this.prisma.user.findUnique({
          where: { id: userId },
          select: { ...baseSelect, ...relationSelect },
        }),

        this.prisma.follow.count({ where: { userId } }),
        this.prisma.follow.count({ where: { followerId: userId } }),
        this.prisma.friends.count({
          where: {
            OR: [
              { requesterId: userId, status: 'ACCEPTED' },
              { receiverId: userId, status: 'ACCEPTED' },
            ],
          },
        }),
        this.prisma.visitors.count({ where: { userId } }),
      ]);

    if (!user) throw new NotFoundException('User not found');

    const agencyCount = user.agencyId ? 1 : 0;

    const countryCode = normalizeCountry(user.country);
    const countryFlag = countryCodeToFlag(countryCode);

    return {
      ...user,
      followersCount,
      followingCount,
      friendsCount,
      visitorsCount,
      agencyCount,
      countryFlag,
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
  // UPLOAD PROFILE PICTURE
  // ----------------------------------

  async uploadProfilePic(userId: string, file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');

    const tempPath = file.path;
    const outputDir = join(process.cwd(), 'uploads/profile');
    const finalFileName = `${userId}.webp`;
    const finalPath = join(outputDir, finalFileName);

    // ensure output folder exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // 🔥 1. Delete old image if exists (any format)
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { profilePicture: true },
    });

    if (user?.profilePicture) {
      const old = join(process.cwd(), user.profilePicture);
      if (fs.existsSync(old)) fs.unlinkSync(old);
    }

    // 🔥 2. Resize + crop + convert to WebP using Sharp
    await sharp(tempPath)
      .resize(300, 300, {
        fit: 'cover',
        position: 'center',
      })
      .webp({ quality: 80 }) // AUTO-WEBP!
      .toFile(finalPath);

    // delete temp raw upload
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);

    // 🔥 3. Update user profile
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        profilePicture: `/uploads/profile/${finalFileName}`,
      },
      select: {
        id: true,
        nickName: true,
        profilePicture: true,
        updatedAt: true,
      },
    });

    return {
      message: 'Profile picture updated successfully (WebP format)',
      user: updatedUser,
    };
  }

  // ----------------------------------
  // UPLOAD COVER PICTURE
  // ----------------------------------

  async uploadCoverPhoto(userId: string, file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');

    const tempPath = file.path;
    const outputDir = join(process.cwd(), 'uploads/cover');
    const finalFileName = `${userId}.webp`;
    const finalPath = join(outputDir, finalFileName);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // 🔥 Delete old cover photo
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { coverImage: true },
    });

    if (user?.coverImage) {
      const old = join(process.cwd(), user.coverImage);
      if (fs.existsSync(old)) fs.unlinkSync(old);
    }

    // 🔥 Resize & convert to WebP
    await sharp(tempPath)
      .resize(1200, 400, {
        // cover aspect ratio
        fit: 'cover',
        position: 'center',
      })
      .webp({ quality: 80 })
      .toFile(finalPath);

    // remove temp file
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);

    // 🔥 update DB
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { coverImage: `/uploads/cover/${finalFileName}` },
      select: {
        id: true,
        coverImage: true,
        updatedAt: true,
      },
    });

    return {
      message: 'Cover photo updated successfully',
      user: updatedUser,
    };
  }

  // ----------------------------------
  // BLOCK USERS LIST
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
  // BLOCK A USER
  // ----------------------------------

  async blockUser(blockerId: string, blockedId: string, reason?: string) {
    if (blockerId === blockedId) {
      throw new BadRequestException('You cannot block yourself');
    }

    // check if user exists
    const target = await this.prisma.user.findUnique({
      where: { id: blockedId },
    });
    if (!target) throw new NotFoundException('User not found');

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
        message: 'User already blocked',
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
      message: 'User blocked successfully',
      blockedUserId: blockedId,
    };
  }

  // ----------------------------------
  // UNBLOCK A USER
  // ----------------------------------

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
      return { message: 'User is not blocked' };
    }

    await this.prisma.block.delete({
      where: {
        blockerId_blockedId: {
          blockerId,
          blockedId,
        },
      },
    });

    return { message: 'User unblocked successfully' };
  }
}
