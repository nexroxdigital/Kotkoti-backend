import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class BackpackService {
  constructor(private readonly prisma: PrismaService) {}

  // get all backpack items grouped by category
  async getAllItemsGrouped(userId: string) {


    //  Fetch all backpack items with item + category info
    const backpackItems = await this.prisma.backpack.findMany({
      where: { userId },
      select: {
        id: true,
        acquiredAt: true,
        isActive: true,
        item: {
          select: {
            id: true,
            name: true,
            icon: true,
            price: true,
            categoryId: true,
            category: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { acquiredAt: 'desc' },
    });

    // Group items by category name
    const grouped: Record<string, any[]> = {};

    for (const bItem of backpackItems) {
      const categoryName = bItem.item.category.name;

      if (!grouped[categoryName]) {
        grouped[categoryName] = [];
      }

      const { category, id, ...itemData } = bItem.item;

      grouped[categoryName].push({
        backpackItemId: bItem.id,
        acquiredAt: bItem.acquiredAt,
        itemId: id,
        ...itemData,
        categoryName: category.name,
        isUsed: bItem.isActive,
      });
    }

    return grouped;
  }

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
   * Update user's activeItemId and activeItems JSON
   */
  async useItem(userId: string, itemId: string) {
    // Step 1: Check if user owns this item and get its category with full item details
    const backpackRecord = await this.prisma.backpack.findFirst({
      where: {
        userId,
        itemId,
      },
      include: {
        item: {
          select: {
            id: true,
            name: true,
            icon: true,
            swf: true,
            swftime: true,
            categoryId: true,
            category: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!backpackRecord) {
      throw new NotFoundException('Item not found in your backpack');
    }

    const categoryId = backpackRecord.item.categoryId;
    const categoryName = backpackRecord.item.category.name;

    // Build item data object for activeItems JSON
    const itemData = {
      id: backpackRecord.item.id,
      name: backpackRecord.item.name,
      icon: backpackRecord.item.icon,
      swf: backpackRecord.item.swf,
      swftime: backpackRecord.item.swftime,
    };

    // Step 2: Use a transaction to deactivate other items in the same category and activate this one
    await this.prisma.$transaction(async (tx) => {
      // Deactivate all items of the same category for this user
      await tx.backpack.updateMany({
        where: {
          userId,
          item: { categoryId },
          isActive: true,
        },
        data: { isActive: false },
      });

      // Activate the selected item
      await tx.backpack.update({
        where: { id: backpackRecord.id },
        data: { isActive: true },
      });

      // Fetch current activeItems JSON
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { activeItems: true },
      });

      const currentActiveItems = (user?.activeItems as any) || {};
      currentActiveItems[categoryName] = itemData; // Update category with full item data

      // Update User with activeItems JSON and activeItemId for legacy compatibility
      await tx.user.update({
        where: { id: userId },
        data: {
          activeItemId: itemId,
          activeItems: currentActiveItems,
        },
      });
    });

    return {
      message: 'Item is now active',
      itemId: itemId,
      categoryId: categoryId,
      categoryName: categoryName,
      itemData: itemData,
    };
  }

  /**
   * Remove a backpack item by its ID
   * 1. Check if backpack item exists for the user
   * 2. remove the item from user
   * 3. Clear activeItemId if it was the active item
   * 4. Remove from activeItems JSON if active
   */
  async removeItem(userId: string, backpackItemId: string) {
    // Step 1: Ensure the backpack item exists for this user with category info
    const backpackItem = await this.prisma.backpack.findFirst({
      where: {
        id: backpackItemId,
        userId,
      },
      select: {
        id: true,
        itemId: true,
        isActive: true,
        item: {
          select: {
            category: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!backpackItem) {
      throw new NotFoundException('Backpack item not found');
    }

    const categoryName = backpackItem.item.category.name;

    // Step 2: Fetch user's currently active item ID
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { activeItemId: true, activeItems: true },
    });

    // Step 3: If this item is active → deactivate it
    if (backpackItem.isActive) {
      await this.prisma.backpack.update({
        where: { id: backpackItemId },
        data: { isActive: false },
      });

      // Clear User.activeItemId if it matches (legacy cleanup)
      if (user?.activeItemId === backpackItem.itemId) {
        const currentActiveItems = (user.activeItems as any) || {};
        delete currentActiveItems[categoryName]; // Remove category from activeItems JSON

        await this.prisma.user.update({
          where: { id: userId },
          data: {
            activeItemId: null,
            activeItems: currentActiveItems,
          },
        });
      }

      return {
        message: 'Item deactivated and removed successfully',
        isActive: false,
      };
    }

    // Step 4: The item was not active → nothing to change in activation status
    return {
      message: 'Item removed successfully',
      isActive: false,
    };
  }
}
