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

import { User } from '@prisma/client/edge';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CompleteProfileDto } from './dto/complete-profile.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Request } from 'express';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
    private jwtService: JwtService,
  ) {}

  // ----------------------------------
  // OTP Generator
  // ----------------------------------
  private generateOtp(length = 6) {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < length; i++) {
      otp += digits[Math.floor(Math.random() * digits.length)];
    }
    return otp;
  }

  // ----------------------------------
  // REGISTER EMAIL
  // ----------------------------------
  async registerEmail(email: string) {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) return { exists: true, message: 'Email already registered' };

    const lastOtp = await this.prisma.emailOtp.findFirst({
      where: { email },
      orderBy: { createdAt: 'desc' },
    });

    if (lastOtp) {
      const diff = Date.now() - new Date(lastOtp.createdAt).getTime();
      if (diff < 30 * 1000)
        throw new BadRequestException(
          'Wait 30 seconds before requesting another OTP',
        );
    }

    const otp = this.generateOtp(6);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const hashedOtp = await bcrypt.hash(otp, 10);

    await this.prisma.emailOtp.create({
      data: {
        email,
        otp: hashedOtp,
        purpose: 'register',
        expiresAt,
      },
    });

    const html = `
      <div style="font-family: monospace; font-size:16px;">
        <p>Your KotKoti verification code:</p>
        <h2 style="letter-spacing:8px;">${otp}</h2>
        <p>This code expires in 10 minutes.</p>
      </div>`;

    await this.mailService.sendMail(email, 'KotKoti verification code', html);

    if (process.env.NODE_ENV !== 'production') {
      return { otp, message: 'OTP sent (dev mode)' };
    }

    return { message: 'OTP sent' };
  }

  // ----------------------------------
  // RESEND OTP
  // ----------------------------------
  async resendOtp(email: string, purpose = 'register') {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) return { exists: true, message: 'Email already registered' };

    const lastOtp = await this.prisma.emailOtp.findFirst({
      where: { email },
      orderBy: { createdAt: 'desc' },
    });

    if (lastOtp) {
      const diff = Date.now() - new Date(lastOtp.createdAt).getTime();
      if (diff < 30 * 1000)
        throw new BadRequestException(
          'Please wait 30 seconds before requesting another OTP',
        );
    }

    const otp = this.generateOtp(6);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const hashedOtp = await bcrypt.hash(otp, 10);

    await this.prisma.emailOtp.create({
      data: {
        email,
        otp: hashedOtp,
        purpose,
        expiresAt,
      },
    });

    const html = `
      <div style="font-family: monospace; font-size:16px;">
        <p>Your new verification code:</p>
        <h2 style="letter-spacing:8px;">${otp}</h2>
        <p>This code expires in 10 minutes.</p>
      </div>`;

    await this.mailService.sendMail(email, 'KotKoti New OTP', html);

    if (process.env.NODE_ENV !== 'production') {
      return { otp, message: 'OTP resent (dev mode)' };
    }

    return { message: 'OTP resent' };
  }

  // ----------------------------------
  // VERIFY OTP
  // ----------------------------------
  async verifyOtp(
    email: string,
    otp: string,
    ip: string,
    purpose = 'register',
  ) {
    // 1. find latest unconsumed OTP
    const rec = await this.prisma.emailOtp.findFirst({
      where: {
        email,
        purpose,
        consumed: false,
        expiresAt: { gte: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!rec) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    // 2. Compare provided OTP with hashed one
    const isMatch = await bcrypt.compare(otp, rec.otp);
    if (!isMatch) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    // 3. Mark OTP as consumed
    await this.prisma.emailOtp.update({
      where: { id: rec.id },
      data: { consumed: true },
    });

    // ---------------------------
    // 4. Detect country from IP
    // ---------------------------
    let country = 'Unknown';

    try {
      const res = await fetch(`http://ip-api.com/json/${ip}`);
      const geo = await res.json();

      if (geo.status === 'success') {
        country = geo.country;
      }
    } catch (err) {
      console.error('IP lookup failed:', err);
    }

    // 5. return country info
    return { country };
  }

  // ----------------------------------
  // SET PASSWORD
  // ----------------------------------
  async setPassword(email: string, password: string) {
    const verifiedOtp = await this.prisma.emailOtp.findFirst({
      where: { email, purpose: 'register', consumed: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!verifiedOtp)
      throw new BadRequestException(
        'OTP not verified. Please verify the OTP first.',
      );

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser)
      throw new BadRequestException('User already created. Please login.');

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: { email, password: hashedPassword },
    });

    return { userId: user.id, message: 'Password set successfully' };
  }

  // ----------------------------------
  // COMPLETE PROFILE + GENERATE TOKENS
  // ----------------------------------
  async completeProfile(dto: CompleteProfileDto) {
    const { email, name, dob, gender, country } = dto;

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user)
      throw new BadRequestException('User not found. Please set password.');

    const updatedUser = await this.prisma.user.update({
      where: { email },
      data: {
        nickName: name,
        dob: dob ? new Date(dob) : null,
        gender,
        country,
      },
    });

    const jti = crypto.randomUUID();
    const refreshRaw = this.jwtService.sign(
      { userId: updatedUser.id, jti },
      { expiresIn: '7d' },
    );
    const refreshHash = await bcrypt.hash(refreshRaw, 10);

    await this.prisma.refreshToken.create({
      data: {
        id: jti,
        token: refreshHash,
        userId: updatedUser.id,
      },
    });

    const token = this.jwtService.sign(
      { userId: updatedUser.id, email: updatedUser.email },
      { expiresIn: '1d' },
    );

    return {
      user: updatedUser,
      token,
      refreshToken: refreshRaw,
    };
  }

  // ----------------------------------
  // LOGIN + REFRESH TOKEN CREATION
  // ----------------------------------
  async login(dto: LoginDto, req?: Request) {
    const { email, phone, password } = dto;

    let user: User | null = null;
    if (email) user = await this.prisma.user.findUnique({ where: { email } });
    else if (phone)
      user = await this.prisma.user.findUnique({ where: { phone } });

    if (!user) throw new BadRequestException('Account not found');

    if (!user.password)
      throw new BadRequestException('User has no password set');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new BadRequestException('Password incorrect');

    // extract request metadata
    const ip =
      (req?.headers?.['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req?.ip ||
      req?.connection?.remoteAddress ||
      undefined;

    const userAgent = req?.headers?.['user-agent']?.toString() || undefined;
    const deviceId = (req?.headers?.['x-device-id'] as string) || undefined;

    // geolocate IP (best-effort)
    let country: string | undefined;
    try {
      if (ip && !['127.0.0.1', '::1'].includes(ip)) {
        const geoRes = await fetch(`http://ip-api.com/json/${ip}`);
        const geo = await geoRes.json();
        if (geo?.status === 'success') country = geo.country;
      }
    } catch (err) {
      // don't block login for geo failures
      country = undefined;
    }

    // create session
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const session = await this.prisma.session.create({
      data: {
        userId: user.id,
        expiresAt,
        lastAccessed: new Date(),
        deviceId,
        ipAddress: ip,
        country,
        userAgent,
      },
    });

    // create access token (shorter expiry recommended; adjust env)
    const accessToken = await this.jwtService.signAsync(
      { userId: user.id, sessionId: session.id, email: user.email },
      { expiresIn:  '1d' },
    );

    // create refresh token with jti (use sessionId in payload)
    const jti = crypto.randomUUID();
    const refreshRaw = await this.jwtService.signAsync(
      { userId: user.id, sessionId: session.id, jti },
      { expiresIn: '7d' },
    );

    const refreshHash = await bcrypt.hash(refreshRaw, 10);

    // store refresh token with jti and link to session
    await this.prisma.refreshToken.create({
      data: {
        id: jti, // acts as the unique id (jti)
        token: refreshHash,
        userId: user.id,
     
      },
    });

    // suspicious login detection: compare last session
    const last = await this.prisma.session.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    if (last) {
      const isNewDevice = deviceId && last.deviceId !== deviceId;
      const isNewCountry = country && last.country !== country;
      if (isNewDevice || isNewCountry) {
        const html = `<p>New login detected for your account</p>
<p>Device: ${deviceId ?? userAgent ?? 'unknown'}</p>
<p>IP: ${ip ?? 'unknown'}</p>
<p>Country: ${country ?? 'unknown'}</p>
<p>If this wasn't you, change your password or revoke sessions immediately.</p>`;
        this.mailService
          .sendMail(user.email, 'New login detected', html)
          .catch(() => {});
      }
    }

    return {
      user,
      token: accessToken,
      refreshToken: refreshRaw,
      sessionId: session.id,
    };
  }

  // ----------------------------------
  // REFRESH TOKEN ROTATION
  // ----------------------------------
  async rotateRefreshToken(refreshToken: string) {
    // 1. Verify refresh token
    let payload;
    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: process.env.JWT_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const { userId, sessionId, jti } = payload;

    // 2. Check session exists
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.userId !== userId) {
      throw new UnauthorizedException('Invalid session');
    }

    // 3. Check session expiry
    if (session.expiresAt && session.expiresAt.getTime() < Date.now()) {
      // Delete expired session
      await this.prisma.session.delete({ where: { id: sessionId } });
      throw new UnauthorizedException('Session expired, please login again');
    }

    // 4. Check refresh token in DB (hashed)
    const stored = await this.prisma.refreshToken.findUnique({
      where: { id: jti },
    });

    if (!stored || stored.userId !== userId) {
      throw new UnauthorizedException('Refresh token not recognized');
    }

    const valid = await bcrypt.compare(refreshToken, stored.token);
    if (!valid) {
      await this.prisma.refreshToken.deleteMany({ where: { userId } });
      throw new UnauthorizedException('Invalid refresh token');
    }

    // 5. Update session lastAccessed
    await this.prisma.session.update({
      where: { id: sessionId },
      data: { lastAccessed: new Date() },
    });

    // 6. Rotate refresh token
    const newJti = crypto.randomUUID();
    const newRefreshRaw = this.jwtService.sign(
      { userId, sessionId, jti: newJti },
      { expiresIn: '7d' },
    );

    const newRefreshHash = await bcrypt.hash(newRefreshRaw, 10);

    // Save new refresh token
    await this.prisma.refreshToken.create({
      data: { id: newJti, token: newRefreshHash, userId },
    });

    // Delete old refresh token
    await this.prisma.refreshToken.delete({ where: { id: jti } });

    // 7. Create NEW access token with same sessionId
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    const newAccessToken = this.jwtService.sign(
      { userId, email: user?.email, sessionId },
      { expiresIn: '1d' },
    );

    return {
      user,
      token: newAccessToken,
      refreshToken: newRefreshRaw,
      sessionId,
    };
  }

  // ----------------------------------
  // LOGOUT
  // ----------------------------------

  async logout(userId: string, sessionId: string) {
    // delete all refresh tokens for user
    await this.prisma.refreshToken.deleteMany({ where: { userId } });

    // delete only the session
    await this.prisma.session.deleteMany({
      where: { id: sessionId, userId },
    });

    return { message: 'Logged out successfully' };
  }

  // ---------- LOGOUT ALL ----------
  async logoutAll(userId: string) {
    await this.prisma.refreshToken.deleteMany({ where: { userId } });
    await this.prisma.session.deleteMany({ where: { userId } });
    return { message: 'Logged out from all devices' };
  }

  // ----------------------------------
  // FORGOT PASSWORD
  // ----------------------------------

  async forgotPassword(dto: ForgotPasswordDto) {
    const { email, phone } = dto;

    let user: User | null = null;

    if (email) {
      user = await this.prisma.user.findUnique({ where: { email } });
    } else if (phone) {
      user = await this.prisma.user.findUnique({ where: { phone } });
    }

    // SECURITY: Always respond success even if user doesn't exist
    // But only send OTP if user exists
    if (!user) {
      return { message: 'If this account exists, a reset link has been sent.' };
    }

    const targetEmail = user.email; // Always send reset OTP to registered email

    // rate-limit
    const lastOtp = await this.prisma.emailOtp.findFirst({
      where: { email: targetEmail, purpose: 'forgot_password' },
      orderBy: { createdAt: 'desc' },
    });

    if (lastOtp) {
      const diff = Date.now() - new Date(lastOtp.createdAt).getTime();
      if (diff < 30 * 1000) {
        throw new BadRequestException(
          'Wait 30 seconds before requesting again.',
        );
      }
    }

    const otp = this.generateOtp(6);
    const expiresAt = new Date(Date.now() + 10 * 60 * 500);

    const hashedOtp = await bcrypt.hash(otp, 10);

    await this.prisma.emailOtp.create({
      data: {
        email: targetEmail,
        otp: hashedOtp,
        purpose: 'forgot_password',
        expiresAt,
      },
    });

    const html = `
    <div style="font-family: monospace; font-size:16px;">
      <p>Your password reset code:</p>
      <h2 style="letter-spacing:8px;">${otp}</h2>
      <p>This code expires in 5 minutes.</p>
    </div>
  `;

    await this.mailService.sendMail(targetEmail, 'Password Reset Code', html);

    return {
      message: 'If this account exists, a reset code has been sent.',
      ...(process.env.NODE_ENV !== 'production' ? { otp } : {}),
    };
  }

  // ----------------------------------
  // RESET PASSWORD
  // ----------------------------------
async verifyForgotOtp(email: string, otp: string) {
  // 1. find latest unconsumed OTP
  const rec = await this.prisma.emailOtp.findFirst({
    where: {
      email,
      purpose: 'forgot_password',
      consumed: false,
      expiresAt: { gte: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!rec) throw new BadRequestException('Invalid or expired OTP');

  // 2. compare otp
  const match = await bcrypt.compare(otp, rec.otp);
  if (!match) throw new BadRequestException('Invalid OTP');

  // 3. mark otp consumed
  await this.prisma.emailOtp.update({
    where: { id: rec.id },
    data: { consumed: true },
  });

  return { success: true, message: 'OTP verified' };
}


async setNewPassword(email: string, newPassword: string) {
  // check otp consumed
  const consumedOtp = await this.prisma.emailOtp.findFirst({
    where: {
      email,
      purpose: 'forgot_password',
      consumed: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!consumedOtp) {
    throw new BadRequestException('OTP not verified. Please verify OTP first.');
  }

  const user = await this.prisma.user.findUnique({ where: { email } });
  if (!user) throw new BadRequestException('User not found');

  const hashed = await bcrypt.hash(newPassword, 10);

  await this.prisma.user.update({
    where: { email },
    data: { password: hashed },
  });

  // remove all sessions for safety
  await this.prisma.session.deleteMany({ where: { userId: user.id } });

  // remove all refresh tokens
  await this.prisma.refreshToken.deleteMany({ where: { userId: user.id } });

  return { message: 'Password reset successful' };
}

  async resetPassword(dto: ResetPasswordDto) {
    const { email, otp, newPassword } = dto;

    // 1. find the OTP
    const record = await this.prisma.emailOtp.findFirst({
      where: {
        email,
        purpose: 'forgot_password',
        consumed: false,
        expiresAt: { gte: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    // 2. verify OTP
    const isMatch = await bcrypt.compare(otp, record.otp);
    if (!isMatch) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    // 3. mark OTP as consumed
    await this.prisma.emailOtp.update({
      where: { id: record.id },
      data: { consumed: true },
    });

    // 4. update user password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    return {
      message: 'Password has been reset successfully',
    };
  }

  // ----------------------------------
  // CHANGE PASSWORD
  // ----------------------------------

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const { oldPassword, newPassword } = dto;

    // 1. Find user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // 2. Check old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      throw new BadRequestException('Old password is incorrect');
    }

    // 3. Prevent using same password
    const isSame = await bcrypt.compare(newPassword, user.password);
    if (isSame) {
      throw new BadRequestException('New password must be different');
    }

    // 4. Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // 5. Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    // revoke sessions & refresh tokens as extra security
    await this.prisma.refreshToken.deleteMany({ where: { userId } });
    await this.prisma.session.deleteMany({ where: { userId } });

    return {
      message: 'Password changed successfully',
    };
  }

  //  get user data
  async getUserData(userId: string) {
    // 1. Fetch user (exclude password)
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nickName: true,
        email: true,
        phone: true,
        roleId: true,
        dob: true,
        bio: true,
        gender: true,
        country: true,
        agencyId: true,
        vipId: true,
        gold: true,
        diamond: true,
        isDiamondBlocked: true,
        isGoldBlocked: true,
        isAccountBlocked: true,
        isHost: true,
        isReseller: true,
        charmLevel: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
            levelup_point: true,
          },
        },
        wealthLevel: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
            levelup_point: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 2. Count followers
    const followersCount = await this.prisma.follow.count({
      where: { userId },
    });

    // 3. Count friends (status = ACCEPTED)
    const friendsCount = await this.prisma.friends.count({
      where: {
        OR: [
          { requesterId: userId, status: 'ACCEPTED' },
          { receiverId: userId, status: 'ACCEPTED' },
        ],
      },
    });

    // 4. Count agency (1 if user has agencyId)
    const agencyCount = user.agencyId ? 1 : 0;

    // 5. Return combined data
    return {
      ...user,
      followersCount,
      friendsCount,
      agencyCount,
    };
  }
}
