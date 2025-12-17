import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateStoreItemDto } from './dto/create-store-item.dto';
import { UpdateStoreItemDto } from './dto/update-store-item.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class StoreManagementService {
  constructor(private prisma: PrismaService) {}

  // Create a new store item
  async createItem(dto: CreateStoreItemDto) {
    return this.prisma.storeItem.create({
      data: dto,
    });
  }

  // Get all store items
  async findAllItem() {
    return this.prisma.storeItem.findMany({
      include: {
        category: true,
        backpacks: true,
      },
    });
  }

  // Get a single store item by id
  async findOneItem(id: string) {
    return this.prisma.storeItem.findUniqueOrThrow({
      where: { id },
      include: {
        category: true,
        backpacks: true,
      },
    });
  }

  // Update a store item by id
  async updateItem(id: string, dto: UpdateStoreItemDto) {
    return this.prisma.storeItem.update({
      where: { id },
      data: dto,
    });
  }

  // Delete a store item by id
  async deleteItem(id: string) {
    const item = await this.prisma.storeItem.findUnique({
      where: { id },
      include: { backpacks: true },
    });

    if (!item) throw new NotFoundException('Store item not found');

    // Delete related backpacks first (break relation)
    if (item.backpacks.length > 0) {
      await this.prisma.backpack.deleteMany({
        where: { itemId: id },
      });
    }

    // Delete files if they exist
    const files = [item.icon, item.swf];
    for (const file of files) {
      if (file) {
        const filePath = path.join(process.cwd(), file); // resolve absolute path
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }

    // 4. Delete the store item
    return this.prisma.storeItem.delete({
      where: { id },
    });
  }
}
