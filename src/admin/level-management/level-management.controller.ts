import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  ParseIntPipe,
} from '@nestjs/common';

import { LevelManagementService } from './level-management.service';
import {
  CreateCategoryLevelDto,
  UpdateCategoryLevelDto,
} from './dto/category-level-privileges.dto';
import {
  CreateLevelGiftDto,
  UpdateLevelGiftDto,
} from './dto/level-privileges-gift.dto';

@Controller('level-management')
export class LevelManagementController {
  constructor(
    private readonly levelManagementService: LevelManagementService,
  ) {}

  @Post('category/add')
  addNewCategory(@Body() dto: CreateCategoryLevelDto) {
    return this.levelManagementService.createCategory(dto);
  }

  @Get('category/all')
  getAllCategory() {
    return this.levelManagementService.findAllCategory();
  }

  @Get('category/details/:categoryId')
  getOneCategory(@Param('categoryId', ParseIntPipe) id: number) {
    return this.levelManagementService.findOneCategory(id);
  }

  @Put('category/update/:categoryId')
  updateOneCategory(
    @Param('categoryId', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoryLevelDto,
  ) {
    return this.levelManagementService.updateCategory(id, dto);
  }

  // level controller
  @Post('level/add')
  addNewLevel(@Body() dto: CreateLevelGiftDto) {
    return this.levelManagementService.createLevel(dto);
  }

  @Get('level/all')
  getAllLevel() {
    return this.levelManagementService.findAllLevel();
  }

  @Get('level/details/:levelId')
  getOneLevel(@Param('levelId', ParseIntPipe) id: number) {
    return this.levelManagementService.findOneLevel(id);
  }

  @Put('level/update/:levelId')
  updateOneLevel(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateLevelGiftDto,
  ) {
    return this.levelManagementService.updateLevel(id, dto);
  }
}
