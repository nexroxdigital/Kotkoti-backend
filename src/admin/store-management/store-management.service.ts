import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateStoreItemDto } from './dto/create-store-item.dto';
import { UpdateStoreItemDto } from './dto/update-store-item.dto';

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
    return this.prisma.storeItem.delete({
      where: { id },
    });
  }
}
