import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { User } from '@prisma/client';
import type { Request } from 'express';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { StoreService } from './store.service';

export interface RequestWithUser extends Request {
  user: User;
}

@Controller('store')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  //    get all categories
  @Get('all-categories')
  @UseGuards(JwtAuthGuard)
  async getAllCategories() {
    return this.storeService.getAllCategories();
  }

  // get items by category
  @Get('items-by-category/:categoryId')
  @UseGuards(JwtAuthGuard)
  async getItemsByCategory(
    @Param('categoryId', new ParseUUIDPipe()) categoryId: string,
  ) {
    return this.storeService.getItemsByCategory(categoryId);
  }

  // get single items
  @UseGuards(JwtAuthGuard)
  @Get('items-by-category/details/:itemId')
  async getItemDetails(@Param('itemId') itemId: string) {
    return this.storeService.getItemDetails(itemId);
  }

  // search items with infinity scrolling
  @UseGuards(JwtAuthGuard)
  @Get('search-items')
  async searchItems(
    @Query('searchTerm') searchTerm: string,
    @Query('cursor') cursor?: string, // last item ID from previous batch
    @Query('limit') limit = 10, // batch size, default 10
  ) {
    return this.storeService.searchItemsInfinite(
      searchTerm,
      cursor,
      Number(limit),
    );
  }

  // buy store item
  @UseGuards(JwtAuthGuard)
  @Post('buy/:itemId')
  async buyItem(@Param('itemId') itemId: string, @Req() req: RequestWithUser) {
    const userId = (req.user as any).userId;
    return this.storeService.buyItem(userId, itemId);
  }

  // send store item to another user
  @Post('send-item/:itemId')
  async sendItem(
    @Param('itemId') itemId: string,
    @Body('receiverId') receiverId: string,
    @Req() req: RequestWithUser,
  ) {
    const senderId = (req.user as any).userId;
    return this.storeService.sendItemFromStore(senderId, receiverId, itemId);
  }

  // last bracket
}
