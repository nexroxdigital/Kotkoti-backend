import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import * as bcrypt from 'bcrypt';
import { CompleteProfileDto } from './dto/complete-profile.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
    private jwtService: JwtService, 
  ) {}

  private generateOtp(length = 6) {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < length; i++)
      otp += digits[Math.floor(Math.random() * digits.length)];
    return otp;
  }

  async registerEmail(email: string) {
    // check if user exists and return exists flag
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) return { exists: true, message: 'Email already registered' };

    // rate limit: avoid too frequent sends
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
    const expiresAt = new Date(Date.now() + 10 * 60 * 500); // 10 min
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
        <p>This code expires in 5 minutes.</p>
      </div>`;

    await this.mailService.sendMail(email, 'KotKoti verification code', html);

    // in dev env you can return otp for testing; in production do NOT return it
    if (process.env.NODE_ENV !== 'production') {
      return { otp, message: 'OTP resent (dev mode)' };
    }

    return { message: 'OTP resent' };
  }

  async resendOtp(email: string, purpose = 'register') {
    // Optional: if user already registered, do not resend OTP
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      return { exists: true, message: 'Email already registered' };
    }

    // Rate limit again (prevents spamming)
    const lastOtp = await this.prisma.emailOtp.findFirst({
      where: { email },
      orderBy: { createdAt: 'desc' },
    });

    if (lastOtp) {
      const diff = Date.now() - new Date(lastOtp.createdAt).getTime();
      if (diff < 30 * 1000) {
        throw new BadRequestException(
          'Please wait 30 seconds before requesting another OTP',
        );
      }
    }

    const otp = this.generateOtp(6);
    const expiresAt = new Date(Date.now() + 10 * 60 * 500);

    const hashedOtp = await bcrypt.hash(otp, 10);

    await this.prisma.emailOtp.create({
      data: {
        email,
        otp: hashedOtp,
        purpose,
        expiresAt,
        consumed: false,
      },
    });

    // send email
    const html = `
    <div style="font-family: monospace; font-size:16px;">
      <p>Your new verification code:</p>
      <h2 style="letter-spacing:8px;">${otp}</h2>
      <p>This code expires in 10 minutes.</p>
    </div>
  `;

    await this.mailService.sendMail(email, 'Your new OTP code', html);

    if (process.env.NODE_ENV !== 'production') {
      return { otp, message: 'New OTP resent (dev mode)' };
    }

    return { message: 'OTP resent' };
  }

  async verifyOtp(email: string, otp: string, purpose = 'register') {
    // find latest unconsumed OTP for this email
    const rec = await this.prisma.emailOtp.findFirst({
      where: {
        email,
        purpose,
        consumed: false,
        expiresAt: {
          gte: new Date(), // not expired
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!rec) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    // compare provided OTP with hashed one
    const isMatch = await bcrypt.compare(otp, rec.otp);
    if (!isMatch) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    // mark OTP as consumed
    await this.prisma.emailOtp.update({
      where: { id: rec.id },
      data: { consumed: true },
    });

    return true;
  }


  async setPassword(email: string, password: string) {
  // 1. check otp verified
  const verifiedOtp = await this.prisma.emailOtp.findFirst({
    where: {
      email,
      purpose: 'register',
      consumed: true,  // OTP must be consumed (verified)
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!verifiedOtp) {
    throw new BadRequestException(
      'OTP not verified. Please verify the OTP first.',
    );
  }

  // 2. check if user already registered
  const existingUser = await this.prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new BadRequestException('User already created. Please login.');
  }

  // 3. hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // 4. create user
  const user = await this.prisma.user.create({
    data: {
      email,
      password: hashedPassword,
    },
  });

  return { userId: user.id, message: 'Password set successfully' };
}


async completeProfile(dto: CompleteProfileDto) {
  const { email, name, dob, gender, country } = dto;

  // 1. user must exist
  const user = await this.prisma.user.findUnique({ where: { email } });
  if (!user) throw new BadRequestException('User not found. Please set password first.');

  // 2. update profile
  const updatedUser = await this.prisma.user.update({
    where: { email },
    data: {
      nickName: name,
      dob: dob ? new Date(dob) : null,
      gender,
      country,
    },
  });

  // 3. issue access token
  const token = await this.jwtService.signAsync({
    userId: updatedUser.id,
    email: updatedUser.email,
  });

  // Optional: create refresh token & store in DB
  const refreshToken = await this.jwtService.signAsync(
    { userId: updatedUser.id },
    { expiresIn: '7d' },
  );

  // Save refresh token (your table must exist)
  await this.prisma.refreshToken.create({
    data: {
      userId: updatedUser.id,
      token: refreshToken,
    },
  });

  return {
    user: updatedUser,
    token,
    refreshToken,
  };
}


}
