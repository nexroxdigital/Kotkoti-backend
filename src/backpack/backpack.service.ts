import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class BackpackService {
  constructor(private readonly prisma: PrismaService) {}

  async getItemsByCategory(userId: string, categoryId: string) {
    // Ensure category exists
    const category = await this.prisma.storeCategory.findUnique({
      where: { id: categoryId },
      select: {
        id: true,
        name: true,
        icon: true,
      },
    });

    if (!category) throw new NotFoundException('Category not found');

    // Fetch only the necessary fields
    const items = await this.prisma.backpack.findMany({
      where: {
        userId,
        item: { categoryId },
      },
      select: {
        id: true,
        quantity: true,
        acquiredAt: true,
        item: {
          select: {
            id: true,
            name: true,
            icon: true,
            price: true,
            type: true,
          },
        },
      },
      orderBy: { acquiredAt: 'desc' },
    });

    return {
      category,
      totalItems: items.length,
      items,
    };
  }

  /**
   * Fetch detailed info of a single backpack item by its ID for the authenticated user
   */
  async getItemDetailsById(userId: string, backpackItemId: string) {
    // Fetch backpack record and include related store item and category
    const backpackItem = await this.prisma.backpack.findFirst({
      where: {
        id: backpackItemId,
        userId, // ensure the item belongs to the authenticated user
      },
      select: {
        id: true, // Backpack record ID
        quantity: true,
        acquiredAt: true,
        item: {
          select: {
            id: true, // Store item ID
            name: true,
            icon: true,
            price: true,
            type: true,
            validity: true,
            createdAt: true,
            category: {
              select: {
                id: true,
                name: true,
                icon: true,
              },
            },
          },
        },
      },
    });

    if (!backpackItem) {
      throw new NotFoundException('Backpack item not found');
    }

    return backpackItem;
  }

  /**
   * Search backpack items by name or category name with cursor-based pagination
   */
  async searchBackpackItems(
    userId: string,
    searchTerm: string,
    cursor?: string,
    limit = 20,
  ) {
    const items = await this.prisma.backpack.findMany({
      take: limit,
      skip: cursor ? 1 : 0, // skip cursor itself if provided
      cursor: cursor ? { id: cursor } : undefined,
      where: {
        userId,
        OR: [
          { item: { name: { contains: searchTerm, mode: 'insensitive' } } },
          {
            item: {
              category: { name: { contains: searchTerm, mode: 'insensitive' } },
            },
          },
        ],
      },
      orderBy: { acquiredAt: 'desc' },
      select: {
        id: true, // backpack ID
        quantity: true,
        acquiredAt: true,
        item: {
          select: {
            id: true,
            name: true,
            icon: true,
            price: true,
            type: true,
            validity: true,
            createdAt: true,
            category: {
              select: {
                id: true,
                name: true,
                icon: true,
              },
            },
          },
        },
      },
    });

    // Prepare cursor for next fetch
    const nextCursor = items.length > 0 ? items[items.length - 1].id : null;

    return {
      items,
      nextCursor,
    };
  }

  /**
   * Activate an item for a user
   * Check if user owns the item in backpack
   * Update user's activeItemId
   */
  async useItem(userId: string, itemId: string) {
    // Step 1: Check if user owns this item
    const backpackRecord = await this.prisma.backpack.findFirst({
      where: {
        userId,
        itemId,
      },
    });

    if (!backpackRecord) {
      throw new NotFoundException('Item not found in your backpack');
    }

    // Step 2: Update user's activeItemId
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { activeItemId: itemId },
      select: {
        id: true,
        activeItemId: true,
      },
    });

    // Step 3: Return success response with currently active itemId
    return {
      message: 'Item is now active',
      activeItemId: updatedUser.activeItemId,
    };
  }

  /**
   * Remove a backpack item by its ID
   * 1. Check if backpack item exists for the user
   * 2. remove the item from user
   * 3. Clear activeItemId if it was the active item
   */
  async removeItem(userId: string, backpackItemId: string) {
    // Step 1: Ensure the backpack item exists for this user
    const backpackItem = await this.prisma.backpack.findFirst({
      where: {
        id: backpackItemId,
        userId,
      },
      select: {
        id: true,
        itemId: true,
      },
    });

    if (!backpackItem) {
      throw new NotFoundException('Backpack item not found');
    }

    // Step 2: Fetch user's currently active item ID
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { activeItemId: true },
    });

    // Step 3: If this item is currently active → deactivate it
    if (user?.activeItemId === backpackItem.itemId) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { activeItemId: null },
      });

      return {
        message: 'Active item removed successfully',
        activeItemId: null,
      };
    }

    // Step 4: The item was not active → nothing to change
    return {
      message: 'Item is not active, nothing changed',
      activeItemId: user?.activeItemId ?? null,
    };
  }
}
