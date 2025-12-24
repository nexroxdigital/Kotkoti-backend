import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
// import {
//   CreateCategoryLevelDto,
//   UpdateCategoryLevelDto,
// } from './dto/category-level-privileges.dto';
// import {
//   CreateLevelGiftDto,
//   UpdateLevelGiftDto,
// } from './dto/level-privileges-gift.dto';

@Injectable()
export class LevelManagementService {
  constructor(private prisma: PrismaService) {}

  // // create category
  // async createCategory(dto: CreateCategoryLevelDto) {
  //   return this.prisma.category_Level_privileges.create({ data: dto });
  // }

  // //  all category
  // async findAllCategory() {
  //   return this.prisma.category_Level_privileges.findMany({
  //     include: { privileges: true },
  //   });
  // }

  // // detail category
  // async findOneCategory(id: number) {
  //   const category = await this.prisma.category_Level_privileges.findUnique({
  //     where: { id },
  //     include: { privileges: true },
  //   });
  //   if (!category) throw new NotFoundException('Category not found');
  //   return category;
  // }

  // // update category
  // async updateCategory(id: number, dto: UpdateCategoryLevelDto) {
  //   await this.findOneCategory(id); // check if exists
  //   return this.prisma.category_Level_privileges.update({
  //     where: { id },
  //     data: dto,
  //   });
  // }

  // create  Level Gift
  // async createLevel(dto: CreateLevelGiftDto) {
  //   return this.prisma.level_privileges_Gift.create({ data: dto });
  // }

  // // find all Level Gift
  // async findAllLevel() {
  //   return this.prisma.level_privileges_Gift.findMany({
  //     include: { category: true },
  //   });
  // }

  // // find one Level Gift
  // async findOneLevel(id: number) {
  //   const gift = await this.prisma.level_privileges_Gift.findUnique({
  //     where: { id },
  //     include: { category: true },
  //   });
  //   if (!gift) throw new NotFoundException('Gift not found');
  //   return gift;
  // }

  // //  update Level Gift
  // async updateLevel(id: number, dto: UpdateLevelGiftDto) {
  //   await this.findOneLevel(id); // check if exists
  //   return this.prisma.level_privileges_Gift.update({
  //     where: { id },
  //     data: dto,
  //   });
  // }
}
