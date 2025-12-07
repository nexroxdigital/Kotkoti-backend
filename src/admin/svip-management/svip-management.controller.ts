import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { SvipManagementService } from './svip-management.service';
import {
  AddMediaPrivilegeDto,
  AddPowerPrivilegeDto,
  CreateSvipDto,
  UpdateSvipDto,
} from './dto/svip.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { svipMulterConfig } from 'src/common/multer.config';

@Controller('svip-management')
export class SvipManagementController {
  constructor(private readonly svipManagementService: SvipManagementService) {}

  // Create SVIP Level
  @Post('/add-svip-level')
  @UseInterceptors(FileInterceptor('img', svipMulterConfig))
  create(
    @Body() dto: CreateSvipDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (file) dto.img = file.path;

    return this.svipManagementService.create(dto);
  }

  // Get all SVIP levels
  @Get('/all-svip-level')
  findAll() {
    return this.svipManagementService.findAll();
  }

  // Get one SVIP Level by ID
  @Get('/svip-level-details/:svipId')
  findOne(@Param('svipId', ParseIntPipe) svipId: number) {
    return this.svipManagementService.findOne(svipId);
  }

  // Update SVIP Level
  @Put('/updated-svip-level/:svipId')
  update(
    @Param('svipId', ParseIntPipe) svipId: number,
    @Body() dto: UpdateSvipDto,
  ) {
    return this.svipManagementService.update(svipId, dto);
  }

  // Delete SVIP Level
  @Delete('/delete-svip-level/:svipId')
  remove(@Param('svipId', ParseIntPipe) svipId: number) {
    return this.svipManagementService.remove(svipId);
  }

  // POWER PRIVILEGES

  // Add Power Privilege
  @Post('/power-privilege/:svipId')
  addPowerPrivilege(
    @Param('svipId', ParseIntPipe) svipId: number,
    @Body() dto: AddPowerPrivilegeDto,
  ) {
    return this.svipManagementService.addPowerPrivilege(svipId, dto);
  }

  // Delete Power Privilege
  @Delete('/power-privilege/delete/:privId')
  deletePowerPrivilege(@Param('privId', ParseIntPipe) privId: number) {
    return this.svipManagementService.deletePowerPrivilege(privId);
  }

  // MEDIA PRIVILEGES

  // Add Media Privilege
  @Post('/media-privilege/:svipId')
  @UseInterceptors(FileInterceptor('img', svipMulterConfig))
  addMediaPrivilege(
    @Param('svipId', ParseIntPipe) svipId: number,
    @Body() dto: AddMediaPrivilegeDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (file) dto.swf = file.path;

    return this.svipManagementService.addMediaPrivilege(svipId, dto);
  }

  // Delete Media Privilege
  @Delete('/media-privilege/delete/:privId')
  deleteMediaPrivilege(@Param('privId', ParseIntPipe) privId: number) {
    return this.svipManagementService.deleteMediaPrivilege(privId);
  }
}
