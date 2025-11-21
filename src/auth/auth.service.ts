import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

import { CompleteProfileDto } from './dto/complete-profile.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { User } from '@prisma/client/edge';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

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
  async verifyOtp(email: string, otp: string, purpose = 'register') {
    const rec = await this.prisma.emailOtp.findFirst({
      where: {
        email,
        purpose,
        consumed: false,
        expiresAt: { gte: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!rec) throw new BadRequestException('Invalid or expired OTP');

    const isMatch = await bcrypt.compare(otp, rec.otp);
    if (!isMatch) throw new BadRequestException('Invalid or expired OTP');

    await this.prisma.emailOtp.update({
      where: { id: rec.id },
      data: { consumed: true },
    });

    return true;
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
  async login(dto: LoginDto) {
    const { email, phone, password } = dto;

    let user: User | null = null;

    if (email) user = await this.prisma.user.findUnique({ where: { email } });
    else if (phone)
      user = await this.prisma.user.findUnique({ where: { phone } });

    if (!user) throw new BadRequestException('Invalid credentials');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new BadRequestException('Invalid credentials');

    const jti = crypto.randomUUID();
    const refreshRaw = this.jwtService.sign(
      { userId: user.id, jti },
      { expiresIn: '7d' },
    );
    const refreshHash = await bcrypt.hash(refreshRaw, 10);

    await this.prisma.refreshToken.deleteMany({ where: { userId: user.id } });

    await this.prisma.refreshToken.create({
      data: {
        id: jti,
        token: refreshHash,
        userId: user.id,
      },
    });

    const token = this.jwtService.sign(
      { userId: user.id, email: user.email },
      { expiresIn: '1d' },
    );

    return { user, token, refreshToken: refreshRaw };
  }

  // ----------------------------------
  // REFRESH TOKEN ROTATION
  // ----------------------------------
  async rotateRefreshToken(refreshToken: string) {
    let payload;
    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: process.env.JWT_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const { userId, jti } = payload;

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

    const newJti = crypto.randomUUID();
    const newRefreshRaw = this.jwtService.sign(
      { userId, jti: newJti },
      { expiresIn: '7d' },
    );
    const newRefreshHash = await bcrypt.hash(newRefreshRaw, 10);

    await this.prisma.refreshToken.create({
      data: { id: newJti, token: newRefreshHash, userId },
    });

    await this.prisma.refreshToken.delete({ where: { id: jti } });

    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    const newAccessToken = this.jwtService.sign(
      { userId, email: user?.email },
      { expiresIn: '1d' },
    );

    return {
      user,
      token: newAccessToken,
      refreshToken: newRefreshRaw,
    };
  }

  // ----------------------------------
  // LOGOUT 
  // ----------------------------------

  async logout(userId: string) {
    // delete all refresh tokens for user
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });

    return { message: 'Logged out successfully' };
  }

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

  return {
    message: 'Password changed successfully',
  };
}


}
