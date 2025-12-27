import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateCharmLevelDto,
  // CreateWealthLevelDto,
  UpdateCharmLevelDto,
  // UpdateWealthLevelDto,
  CreateLevelPrivilegeDto,
  UpdateLevelPrivilegeDto,
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

  // CharmLevel Privilege Methods

  async createCharmLevelPrivilege(dto: CreateLevelPrivilegeDto) {
    // Check if charm level exists
    const charmLevel = await this.prisma.charmLevel.findUnique({
      where: { id: dto.levelId },
    });

    if (!charmLevel) {
      throw new NotFoundException(
        `CharmLevel with ID ${dto.levelId} not found`,
      );
    }

    // Check if privilege already exists for this level
    const existingPrivilege = await this.prisma.charmLevelPrivilege.findUnique({
      where: { charmLevelId: dto.levelId },
    });

    if (existingPrivilege) {
      throw new ConflictException(
        `Privilege already exists for CharmLevel with ID ${dto.levelId}. Use update instead.`,
      );
    }

    // Verify store item exists if provided
    if (dto.storeItemsId) {
      const storeItem = await this.prisma.storeItem.findUnique({
        where: { id: dto.storeItemsId },
      });

      if (!storeItem) {
        throw new NotFoundException(
          `StoreItem with ID ${dto.storeItemsId} not found`,
        );
      }
    }

    return this.prisma.charmLevelPrivilege.create({
      data: {
        charmLevelId: dto.levelId,
        storeItemsId: dto.storeItemsId || null,
        isPower: dto.isPower ?? false,
        canCreateFamily: dto.canCreateFamily ?? false,
        roomAdminLimit: dto.roomAdminLimit ?? 0,
      },
      include: {
        charmLevel: true,
        storeItems: true,
      },
    });
  }

  async findCharmLevelPrivilege(charmLevelId: string) {
    const privilege = await this.prisma.charmLevelPrivilege.findUnique({
      where: { charmLevelId },
      include: {
        charmLevel: true,
        storeItems: true,
      },
    });

    if (!privilege) {
      throw new NotFoundException(
        `Privilege for CharmLevel with ID ${charmLevelId} not found`,
      );
    }

    return privilege;
  }

  async updateCharmLevelPrivilege(
    charmLevelId: string,
    dto: UpdateLevelPrivilegeDto,
  ) {
    // Check if privilege exists
    await this.findCharmLevelPrivilege(charmLevelId);

    // Verify store item exists if provided
    if (dto.storeItemsId) {
      const storeItem = await this.prisma.storeItem.findUnique({
        where: { id: dto.storeItemsId },
      });

      if (!storeItem) {
        throw new NotFoundException(
          `StoreItem with ID ${dto.storeItemsId} not found`,
        );
      }
    }

    const data: any = {};
    if (dto.storeItemsId !== undefined) data.storeItemsId = dto.storeItemsId;
    if (dto.isPower !== undefined) data.isPower = dto.isPower;
    if (dto.canCreateFamily !== undefined)
      data.canCreateFamily = dto.canCreateFamily;
    if (dto.roomAdminLimit !== undefined)
      data.roomAdminLimit = dto.roomAdminLimit;

    return this.prisma.charmLevelPrivilege.update({
      where: { charmLevelId },
      data,
      include: {
        charmLevel: true,
        storeItems: true,
      },
    });
  }

  async deleteCharmLevelPrivilege(charmLevelId: string) {
    // Check if privilege exists
    await this.findCharmLevelPrivilege(charmLevelId);

    return this.prisma.charmLevelPrivilege.delete({
      where: { charmLevelId },
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
