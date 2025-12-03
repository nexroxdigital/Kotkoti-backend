import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { User } from '@prisma/client';
import type { Request } from 'express';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { LuckyPackService } from './lucky-pack.service';

export interface RequestWithUser extends Request {
  user: User;
}

@Controller('lucky-pack')
@UseGuards(JwtAuthGuard)
export class LuckyPackController {
  constructor(private readonly luckyPackService: LuckyPackService) {}

  // Create a new lucky pack in a room
  @Post('create')
  async createLuckyPack(
    @Body() body: { roomId: string; totalGold: number; totalClaimers: number },
    @Req() req: RequestWithUser,
  ) {
    const creatorId = (req.user as any)?.userId;
    const { roomId, totalGold, totalClaimers } = body;

    return this.luckyPackService.createLuckyPack(
      creatorId,
      roomId,
      totalGold,
      totalClaimers,
    );
  }
}
