import { Controller, Get, Delete, Param, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('auth/sessions')
export class SessionsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async list(@Req() req: any) {
    const userId = req.user.userId;
    const sessions = await this.prisma.session.findMany({
      where: { userId },
      orderBy: { lastAccessed: 'desc' },
    });
    const currentId = req.user.sessionId;
    return sessions.map((s) => ({
      id: s.id,
      deviceId: s.deviceId,
      ipAddress: s.ipAddress,
      country: s.country,
      userAgent: s.userAgent,
      createdAt: s.createdAt,
      lastAccessed: s.lastAccessed,
      expiresAt: s.expiresAt,
      isCurrent: s.id === currentId,
    }));
  }
}
