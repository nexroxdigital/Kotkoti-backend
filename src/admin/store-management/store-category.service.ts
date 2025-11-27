import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateStoreCategoryDto } from './dto/update-store-category.dto';
import { CreateStoreCategoryDto } from './dto/create-store-category.dto';

@Injectable()
export class StoreCategoryService {
  constructor(private prisma: PrismaService) {}

  //  Create a new store category
  async createCategory(dto: CreateStoreCategoryDto) {
    return this.prisma.storeCategory.create({ data: dto });
  }

  //  Get all store categories
  async findAllCategory() {
    return this.prisma.storeCategory.findMany({
      include: { items: true },
    });
  }

  //  Get a single store category by id
  async findOneCategory(id: string) {
    return this.prisma.storeCategory.findUniqueOrThrow({
      where: { id },
      include: { items: true },
    });
  }

  //  Update a store category by id
  async updateOneCategory(id: string, dto: UpdateStoreCategoryDto) {
    return this.prisma.storeCategory.update({
      where: { id },
      data: dto,
    });
  }

  //  Delete a store category by id
  async deleteCategory(id: string) {
    return this.prisma.storeCategory.delete({
      where: { id },
    });
  }
}
