import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { DeactivateAccountDto } from './dto/deactivate-account.dto';
import { ReactivateAccountDto } from './dto/reactivate-account.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class UserSettingService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async deleteMyAccount(userId: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        sessions: true,
        refreshTokens: true,
      },
    });

    if (!user) throw new NotFoundException('User not found');

    const match = await bcrypt.compare(password, user.password);
    if (!match) throw new BadRequestException('Incorrect password');

    await this.prisma.session.deleteMany({
      where: { userId },
    });

    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        email: `deleted_${Date.now()}_${userId}@example.com`,
        phone: null,
        password: '',
        nickName: 'Deleted User',
        profilePicture: null,
        bio: '',
        dob: null,
        gender: null,
        country: null,
        isAccountBlocked: true,
      },
    });

    return { message: 'Account deleted successfully' };
  }

  async deactivateMyAccount(userId: string, dto: DeactivateAccountDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { deactivation: true },
    });

    if (!user) throw new NotFoundException('User not found');

    // If already deactivated
    if (user.deactivation) {
      return {
        message: 'Account already deactivated',
        deactivatedAt: user.deactivation.deactivatedAt,
      };
    }

    // Create deactivation record
    const deactivation = await this.prisma.userDeactivation.create({
      data: {
        userId,
        reason: dto.reason ?? null,
        feedback: dto.feedback ?? null,
        deactivatedAt: new Date(),
      },
    });

    // Revoke all active sessions
    await this.prisma.session.deleteMany({ where: { userId } });

    return {
      message: 'Account deactivated successfully',
      deactivatedAt: deactivation.deactivatedAt,
    };
  }

  async reactivateAccount(dto: ReactivateAccountDto, req: any) {
    const { email, phone, password } = dto;

    // 1. Find user by email or phone
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [email ? { email } : {}, phone ? { phone } : {}],
      },
    });

    if (!user) throw new BadRequestException('User not found');

    // 2. Check if account is actually deactivated
    const deactivation = await this.prisma.userDeactivation.findUnique({
      where: { userId: user.id },
    });

    if (!deactivation) {
      throw new BadRequestException('Account is not deactivated');
    }

    // 3. Validate password
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new BadRequestException('Incorrect password');

    // 4. Remove deactivation record
    await this.prisma.userDeactivation.delete({
      where: { userId: user.id },
    });

    // 5. Restore login ability
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isAccountBlocked: false,
      },
    });

    // 6. Create new session
    const ip = req.ip || req.connection.remoteAddress || null;
    const userAgent = req.headers['user-agent'] ?? null;
    const session = await this.prisma.session.create({
      data: {
        userId: user.id,
        ipAddress: ip,
        userAgent,
        country: null,
      },
    });

    // 7. Create new token
    const token = await this.jwtService.signAsync(
      { userId: user.id, sessionId: session.id },
      { expiresIn: '1d' },
    );

    return {
      message: 'Account reactivated successfully',
      user,
      token,
    };
  }
}
