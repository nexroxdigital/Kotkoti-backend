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
// import {
//   CreateCategoryLevelDto,
//   UpdateCategoryLevelDto,
// } from './dto/category-level-privileges.dto';
// import {
//   CreateLevelGiftDto,
//   UpdateLevelGiftDto,
// } from './dto/level-privileges-gift.dto';

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

  // @Get('category/all')
  // getAllCategory() {
  //   return this.levelManagementService.findAllCategory();
  // }

  // @Get('category/details/:categoryId')
  // getOneCategory(@Param('categoryId', ParseIntPipe) id: number) {
  //   return this.levelManagementService.findOneCategory(id);
  // }

  // @Put('category/update/:categoryId')
  // updateOneCategory(
  //   @Param('categoryId', ParseIntPipe) id: number,
  //   @Body() dto: UpdateCategoryLevelDto,
  // ) {
  //   return this.levelManagementService.updateCategory(id, dto);
  // }

  // level controller
  // @Post('level/add')
  // addNewLevel(@Body() dto: CreateLevelGiftDto) {
  //   return this.levelManagementService.createLevel(dto);
  // }

  // @Get('level/all')
  // getAllLevel() {
  //   return this.levelManagementService.findAllLevel();
  // }

  // @Get('level/details/:levelId')
  // getOneLevel(@Param('levelId', ParseIntPipe) id: number) {
  //   return this.levelManagementService.findOneLevel(id);
  // }

  // @Put('level/update/:levelId')
  // updateOneLevel(
  //   @Param('id', ParseIntPipe) id: number,
  //   @Body() dto: UpdateLevelGiftDto,
  // ) {
  //   return this.levelManagementService.updateLevel(id, dto);
  // }
}
