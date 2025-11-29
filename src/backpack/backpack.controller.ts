import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { BackpackService } from './backpack.service';

export interface RequestWithUser extends Request {
  user: User;
}

@Controller('backpack')
@UseGuards(JwtAuthGuard)
export class BackpackController {
  constructor(private readonly backpackService: BackpackService) {}

  // get backpack items by category id
  @Get('items-by-category/:categoryId')
  async getItemsByCategory(
    @Param('categoryId') categoryId: string,
    @Req() req: RequestWithUser,
  ) {
    const userId = (req.user as any).userId;

    return this.backpackService.getItemsByCategory(userId, categoryId);
  }

  //   get backpack single item by backpackItemId
  @Get('items-by-backpackItemId/details/:backpackItemId')
  async getItemsDetailsByBackpackItemId(
    @Param('backpackItemId') backpackItemId: string,
    @Req() req: RequestWithUser,
  ) {
    // Get authenticated user's ID from JWT
    const userId = (req.user as any).userId;

    // Call service to fetch detailed backpack items
    return this.backpackService.getItemDetailsById(userId, backpackItemId);
  }

  //   search backpack item by items name or category name
  @Get('search-items')
  async searchItems(
    @Req() req: RequestWithUser,
    @Query('q') searchTerm: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit = 20,
  ) {
    const userId = (req.user as any).userId;

    return this.backpackService.searchBackpackItems(
      userId,
      searchTerm,
      cursor,
      Number(limit),
    );
  }

  //   use item from backpack
  @Post('use-item/:itemId')
  async useItem(@Param('itemId') itemId: string, @Req() req: RequestWithUser) {
    // Get authenticated user's ID from JWT
    const userId = (req.user as any).userId;

    // Call service to activate the item
    return this.backpackService.useItem(userId, itemId);
  }

  // delete item from backpack
  @Patch('remove-item/:backpackItemId')
  async removeItem(
    @Param('backpackItemId') backpackItemId: string,
    @Req() req: RequestWithUser,
  ) {
    const userId = (req.user as any).userId;
    return this.backpackService.removeItem(userId, backpackItemId);
  }
}
