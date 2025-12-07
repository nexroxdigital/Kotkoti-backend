import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  AddMediaPrivilegeDto,
  AddPowerPrivilegeDto,
  CreateSvipDto,
  UpdateSvipDto,
} from './dto/svip.dto';

@Injectable()
export class SvipManagementService {
  constructor(private prisma: PrismaService) {}

  // Create a new SVIP Level
  async create(dto: CreateSvipDto) {
    return this.prisma.svip.create({
      data: dto,
    });
  }

  // Get all SVIP levels with privileges
  async findAll() {
    return this.prisma.svip.findMany({
      include: {
        powerPrivileges: true,
        mediaPrivileges: true,
      },
    });
  }

  // Get single SVIP level by ID
  async findOne(id: number) {
    return this.prisma.svip.findUnique({
      where: { id },
      include: {
        powerPrivileges: true,
        mediaPrivileges: true,
      },
    });
  }

  // Update SVIP Level
  async update(id: number, dto: UpdateSvipDto) {
    return this.prisma.svip.update({
      where: { id },
      data: dto,
    });
  }

  // Delete SVIP Level
  async remove(id: number) {
    return this.prisma.svip.delete({
      where: { id },
    });
  }

  // POWER PRIVILEGES

  // Add Power Privilege to SVIP
  async addPowerPrivilege(svipId: number, dto: AddPowerPrivilegeDto) {
    return this.prisma.svipPowerPrivilege.create({
      data: {
        svipId,
        powerName: dto.powerName,
      },
    });
  }

  // Delete Power Privilege
  async deletePowerPrivilege(id: number) {
    return this.prisma.svipPowerPrivilege.delete({
      where: { id },
    });
  }

  // MEDIA PRIVILEGES

  // Add Media Privilege to SVIP
  async addMediaPrivilege(svipId: number, dto: AddMediaPrivilegeDto) {
    return this.prisma.svipMediaPrivilege.create({
      data: {
        svipId,
        swf: dto.swf,
        swftime: dto.swftime,
      },
    });
  }

  // Delete Media Privilege
  async deleteMediaPrivilege(id: number) {
    return this.prisma.svipMediaPrivilege.delete({
      where: { id },
    });
  }
}
