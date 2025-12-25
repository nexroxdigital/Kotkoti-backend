import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { User } from '@prisma/client';
import type { Request } from 'express';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { GiftService } from './gift.service';

export interface RequestWithUser extends Request {
  user: User;
}

@Controller('gift')
@UseGuards(JwtAuthGuard)
export class GiftController {
  constructor(private giftService: GiftService) {}

  // all categories
  @Get('all-categories')
  getAllCategories() {
    return this.giftService.getAllCategories();
  }

  // items by category
  @Get('by-category/:categoryId')
  getGiftsByCategory(@Param('categoryId', ParseUUIDPipe) categoryId: string) {
    return this.giftService.getGiftsByCategory(categoryId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('send/:giftId')
  async sendGift(
    @Body('receiverId') receiverId: string[],
    @Body('quantity') quantity: number = 1,
    @Req() req: RequestWithUser,
  ) {
    const senderId = (req.user as any)?.userId;
    if (!senderId) {
      throw new Error('Authenticated user id not found on request');
    }
    // Authenticated user
    const { giftId } = req.params;

    return this.giftService.sendGift(giftId, senderId, receiverId, quantity);
  }
}
