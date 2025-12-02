import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateGiftDto, UpdateGiftDto } from './dto/gift.dto';
import {
  CreateGiftCategoryDto,
  UpdateGiftCategoryDto,
} from './dto/gift-category.dto';

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

  //  Gift Methods
  async createGift(dto: CreateGiftDto) {
    return this.prisma.gift.create({ data: dto });
  }

  async findAllGifts() {
    return this.prisma.gift.findMany({ include: { category: true } });
  }

  async findOneGift(id: string) {
    const gift = await this.prisma.gift.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!gift) throw new NotFoundException('Gift not found');
    return gift;
  }

  async updateGift(id: string, dto: UpdateGiftDto) {
    await this.findOneGift(id);
    return this.prisma.gift.update({ where: { id }, data: dto });
  }
}
