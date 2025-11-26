import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class StoreService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllCategories() {
    const categories = await this.prisma.storeCategory.findMany({
      orderBy: { name: 'asc' },
      include: { items: false },
    });

    return categories;
  }

  async getItemsByCategory(categoryId: string) {
    // Check if category exists
    const category = await this.prisma.storeCategory.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Get all items for this category
    const items = await this.prisma.storeItem.findMany({
      where: { categoryId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      category,
      items,
    };
  }

  async getItemDetails(itemId: string) {
    const item = await this.prisma.storeItem.findUnique({
      where: { id: itemId },
      include: {
        category: true,
      },
    });

    if (!item) {
      throw new NotFoundException('Store item not found');
    }

    return item;
  }

  async searchItemsInfinite(searchTerm: string, cursor?: string, limit = 20) {
    const items = await this.prisma.storeItem.findMany({
      take: limit,
      skip: cursor ? 1 : 0, // skip the cursor itself if provided
      cursor: cursor ? { id: cursor } : undefined,
      where: {
        name: {
          contains: searchTerm,
          mode: 'insensitive',
        },
      },
      orderBy: {
        createdAt: 'desc', // newest items first
      },
      include: {
        category: true,
      },
    });

    // last item ID to send back for next fetch
    const nextCursor = items.length > 0 ? items[items.length - 1].id : null;

    return {
      items,
      nextCursor,
    };
  }

  //   buy store items
  async buyItem(userId: string, itemId: string) {
    // Fetch user and store item
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const item = await this.prisma.storeItem.findUnique({
      where: { id: itemId },
    });
    if (!item) throw new NotFoundException('Store item not found');

    // Check if user has enough gold
    if (user.gold < item.price) {
      throw new BadRequestException('Insufficient gold to buy this item');
    }

    // Deduct gold and add item to backpack
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { gold: { decrement: item.price } },
      }),
      this.prisma.backpack.create({
        data: {
          userId,
          itemId,
          quantity: 1,
          acquiredAt: new Date(),
        },
      }),
    ]);

    return {
      message: 'Item purchased successfully',
      itemId,
      goldLeft: user.gold - item.price,
    };
  }

  // send store items to another user
  async sendItemFromStore(
    senderId: string,
    receiverId: string,
    itemId: string,
  ) {
    // Fetch sender
    const sender = await this.prisma.user.findUnique({
      where: { id: senderId },
    });
    if (!sender) throw new NotFoundException('Sender not found');

    // Fetch store item
    const item = await this.prisma.storeItem.findUnique({
      where: { id: itemId },
    });
    if (!item) throw new NotFoundException('Item not found');

    // Fetch receiver
    const receiver = await this.prisma.user.findUnique({
      where: { id: receiverId },
    });
    if (!receiver) throw new NotFoundException('Receiver not found');

    // Check sender has enough gold
    if (sender.gold < item.price) {
      throw new BadRequestException('Insufficient gold to send this item');
    }

    // Perform transaction: deduct gold, add item to receiver backpack
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: senderId },
        data: { gold: { decrement: item.price } },
      }),
      this.prisma.backpack.create({
        data: {
          userId: receiverId,
          itemId,
          acquiredAt: new Date(),
        },
      }),
    ]);

    return { success: true, message: 'Item sent successfully' };
  }
}
