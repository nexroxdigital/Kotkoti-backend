import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { LevelManagementService } from './level-management.service';
import {
  CreateCharmLevelDto,
  UpdateCharmLevelDto,
  CreateLevelPrivilegeDto,
  UpdateLevelPrivilegeDto,
} from './dto/level.dto';
import { commonImageMulterConfig } from 'src/common/multer.config';
import { FileCleanupInterceptor } from 'src/common/interceptors/file-cleanup.interceptor';

@Controller('level-management')
@UseInterceptors(FileCleanupInterceptor)
export class LevelManagementController {
  constructor(
    private readonly levelManagementService: LevelManagementService,
  ) {}

  // charm level
  @Post('charm-level/add')
  @UseInterceptors(FileInterceptor('imageUrl', commonImageMulterConfig))
  addNewCharmLevel(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateCharmLevelDto,
  ) {
    return this.levelManagementService.createCharmLevel(dto, file);
  }

  @Get('charm-level/all')
  getAllCharmLevel() {
    return this.levelManagementService.findAllCharmLevels();
  }

  @Patch('charm-level/edit/:charmLevelId')
  @UseInterceptors(FileInterceptor('imageUrl', commonImageMulterConfig))
  updateOneCharmLevel(
    @Param('charmLevelId') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UpdateCharmLevelDto,
  ) {
    return this.levelManagementService.updateCharmLevel(id, dto, file);
  }

  // charm level privilege
  @Post('charm-level/privilege/add')
  addCharmLevelPrivilege(@Body() dto: CreateLevelPrivilegeDto) {
    return this.levelManagementService.createCharmLevelPrivilege(dto);
  }

  @Get('charm-level/privilege/:charmLevelId')
  getCharmLevelPrivilege(@Param('charmLevelId') id: string) {
    return this.levelManagementService.findCharmLevelPrivilege(id);
  }

  @Patch('charm-level/privilege/edit/:charmLevelId')
  updateCharmLevelPrivilege(
    @Param('charmLevelId') id: string,
    @Body() dto: UpdateLevelPrivilegeDto,
  ) {
    return this.levelManagementService.updateCharmLevelPrivilege(id, dto);
  }

  @Delete('charm-level/privilege/delete/:charmLevelId')
  deleteCharmLevelPrivilege(@Param('charmLevelId') id: string) {
    return this.levelManagementService.deleteCharmLevelPrivilege(id);
  }
}
