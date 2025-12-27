import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { LevelManagementService } from './level-management.service';
import { CreateCharmLevelDto, UpdateCharmLevelDto } from './dto/level.dto';
import { commonImageMulterConfig } from 'src/common/multer.config';
import { FileCleanupInterceptor } from 'src/common/interceptors/file-cleanup.interceptor';

@Controller('level-management')
@UseInterceptors(FileCleanupInterceptor)
export class LevelManagementController {
  constructor(
    private readonly levelManagementService: LevelManagementService,
  ) {}

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
}
