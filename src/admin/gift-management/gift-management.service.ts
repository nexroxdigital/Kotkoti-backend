import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateGiftDto, UpdateGiftDto } from './dto/gift.dto';
import {
  CreateGiftCategoryDto,
  UpdateGiftCategoryDto,
} from './dto/gift-category.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class GiftManagementService {
  constructor(private prisma: PrismaService) {}

  //  GiftCategory Methods
  async createCategory(dto: CreateGiftCategoryDto) {
    return this.prisma.giftCategory.create({ data: dto });
  }

  async findAllCategories() {
    return this.prisma.giftCategory.findMany({ include: { gifts: true } });
  }

  async findOneCategory(id: string) {
    const category = await this.prisma.giftCategory.findUnique({
      where: { id },
      include: { gifts: true },
    });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async updateCategory(id: string, dto: UpdateGiftCategoryDto) {
    await this.findOneCategory(id);
    return this.prisma.giftCategory.update({ where: { id }, data: dto });
  }

  //  Delete a store category by id
  async deleteCategory(id: string) {
    return this.prisma.giftCategory.delete({
      where: { id },
    });
  }

  //  Gift Methods
  async createGift(dto: CreateGiftDto) {
    return this.prisma.gift.create({ data: dto });
  }

  async findGiftsByCategory(categoryId: string) {
    return this.prisma.gift.findMany({
      where: { categoryId },
      include: {
        category: {
          select: {
            name: true,
          },
        },
      },
    });
  }

  async findAllGifts() {
    return this.prisma.gift.findMany({
      include: {
        category: {
          select: {
            name: true,
          },
        },
      },
    });
  }

  async findOneGift(id: string) {
    const gift = await this.prisma.gift.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            name: true,
          },
        },
      },
    });
    if (!gift) throw new NotFoundException('Gift not found');
    return gift;
  }

  async updateGift(id: string, dto: UpdateGiftDto) {
    await this.findOneGift(id);
    return this.prisma.gift.update({ where: { id }, data: dto });
  }

  async deleteGift(id: string) {
    const gift = await this.prisma.gift.findUnique({
      where: { id },
    });

    if (!gift) throw new NotFoundException('Gift not found');

    // Delete files
    const files = [gift.giftIcon, gift.swf];
    for (const file of files) {
      if (file) {
        // Resolve absolute path
        const filePath = path.join(process.cwd(), file);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }

    // Delete gift from DB
    return this.prisma.gift.delete({
      where: { id },
    });
  }
}
