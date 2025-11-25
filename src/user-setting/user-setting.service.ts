import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { DeactivateAccountDto } from './dto/deactivate-account.dto';

@Injectable()
export class UserSettingService {
  constructor(private prisma: PrismaService) {}   

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



}
