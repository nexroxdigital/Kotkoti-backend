import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class BannerManagementService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateBannerDto) {
    return await this.prisma.homeBanner.create({ data: dto });
  }

  async findAll() {
    return await this.prisma.homeBanner.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const banner = await this.prisma.homeBanner.findUnique({
      where: { id },
    });
    if (!banner) throw new NotFoundException('Banner not found');
    return banner;
  }

  async update(id: number, dto: UpdateBannerDto) {
    const existing = await this.findOne(id);

    // Filter file removal
    if (dto.imgUrl && existing.imgUrl) {
      const oldPath = path.join(process.cwd(), existing.imgUrl);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    return await this.prisma.homeBanner.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: number) {
    const banner = await this.findOne(id);

    if (banner.imgUrl) {
      const filePath = path.join(process.cwd(), banner.imgUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    return await this.prisma.homeBanner.delete({
      where: { id },
    });
  }
}
