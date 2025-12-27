import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateCharmLevelDto,
  // CreateWealthLevelDto,
  UpdateCharmLevelDto,
  // UpdateWealthLevelDto,
} from './dto/level.dto';

@Injectable()
export class LevelManagementService {
  constructor(private prisma: PrismaService) {}

  //  CharmLevel Methods

  async createCharmLevel(dto: CreateCharmLevelDto, file?: Express.Multer.File) {
    const data: any = {
      name: dto.name,
      imageUrl: file ? file.path : dto.imageUrl,
      levelup_point: Number(dto.levelup_point),
      levelNo: Number(dto.levelNo),
    };

    return this.prisma.charmLevel.create({ data });
  }

  async findAllCharmLevels() {
    return this.prisma.charmLevel.findMany({
      orderBy: {
        levelNo: 'asc',
      },
    });
  }

  async findOneCharmLevel(id: string) {
    const charmLevel = await this.prisma.charmLevel.findUniqueOrThrow({
      where: { id },
      include: {
        privileges: {
          include: {
            storeItems: true,
          },
        },
      },
    });

    if (!charmLevel) {
      throw new NotFoundException(`CharmLevel with ID ${id} not found`);
    }

    return charmLevel;
  }

  async updateCharmLevel(
    id: string,
    dto: UpdateCharmLevelDto,
    file?: Express.Multer.File,
  ) {
    await this.findOneCharmLevel(id); // check if exists

    const data: any = {};

    if (dto.name !== undefined) data.name = dto.name;
    if (file) {
      data.imageUrl = file.path;
    } else if (dto.imageUrl !== undefined) {
      data.imageUrl = dto.imageUrl;
    }
    if (dto.levelup_point !== undefined)
      data.levelup_point = Number(dto.levelup_point);
    if (dto.levelNo !== undefined) data.levelNo = Number(dto.levelNo);

    return this.prisma.charmLevel.update({
      where: { id },
      data,
    });
  }

  async deleteCharmLevel(id: string) {
    await this.findOneCharmLevel(id); // check if exists
    return this.prisma.charmLevel.delete({
      where: { id },
    });
  }

  // WealthLevel Methods

  // async createWealthLevel(dto: CreateWealthLevelDto) {
  //   return this.prisma.wealthLevel.create({
  //     data: dto,
  //     include: {
  //       privileges: {
  //         include: {
  //           storeItems: true,
  //         },
  //       },
  //     },
  //   });
  // }

  // async findAllWealthLevels() {
  //   return this.prisma.wealthLevel.findMany({
  //     include: {
  //       privileges: {
  //         include: {
  //           storeItems: true,
  //         },
  //       },
  //     },
  //     orderBy: {
  //       levelNo: 'asc',
  //     },
  //   });
  // }

  // async findOneWealthLevel(id: string) {
  //   const wealthLevel = await this.prisma.wealthLevel.findUnique({
  //     where: { id },
  //     include: {
  //       privileges: {
  //         include: {
  //           storeItems: true,
  //         },
  //       },
  //     },
  //   });

  //   if (!wealthLevel) {
  //     throw new NotFoundException(`WealthLevel with ID ${id} not found`);
  //   }

  //   return wealthLevel;
  // }

  // async updateWealthLevel(id: string, dto: UpdateWealthLevelDto) {
  //   await this.findOneWealthLevel(id); // check if exists

  //   return this.prisma.wealthLevel.update({
  //     where: { id },
  //     data: dto,
  //     include: {
  //       privileges: {
  //         include: {
  //           storeItems: true,
  //         },
  //       },
  //     },
  //   });
  // }

  // async deleteWealthLevel(id: string) {
  //   await this.findOneWealthLevel(id); // check if exists
  //   return this.prisma.wealthLevel.delete({
  //     where: { id },
  //   });
  // }
}
