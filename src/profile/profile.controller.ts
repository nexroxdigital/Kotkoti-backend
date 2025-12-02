import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
  Delete,
  Param,
  Query,
  Put,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UpdateMeDto } from './dto/update-me.dto';
import { ProfileService } from './profile.service';
import { BlockUserDto } from './dto/block.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  coverPicMulterConfig,
  profilePicMulterConfig,
} from 'src/common/multer.config';

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get('view/me')
  @UseGuards(JwtAuthGuard)
  async viewMe(@Req() req: any, @Query('expand') expand?: string) {
    return this.profileService.viewMe(req.user.userId, expand);
  }

  @Get('user/:profileUserId/public-profile')
  @UseGuards(JwtAuthGuard)
  async getPublicProfile(
    @Req() req,
    @Param('profileUserId') profileUserId: string,
    @Query('expand') expand?: string,
  ) {
    return this.profileService.getPublicProfile(
      req.user.userId,
      profileUserId,
      expand,
    );
  }

  @Put('update/me')
  @UseGuards(JwtAuthGuard)
  async updateMe(@Req() req: any, @Body() dto: UpdateMeDto) {
    return this.profileService.updateMe(req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('upload/profile-picture')
  @UseInterceptors(FileInterceptor('file', profilePicMulterConfig))
  async uploadProfilePic(
    @Req() req: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.profileService.uploadProfilePic(req.user.userId, file);
  }

  @Post('upload/cover')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', coverPicMulterConfig))
  async uploadCoverPhoto(
    @Req() req: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.profileService.uploadCoverPhoto(req.user.userId, file);
  }

  @Get('user/blocked')
  @UseGuards(JwtAuthGuard)
  async getBlocked(
    @Req() req: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.profileService.getBlockedUsers(req.user.userId, page, limit);
  }

  @Post('user/:userId/block')
  @UseGuards(JwtAuthGuard)
  async blockUser(
    @Req() req: any,
    @Param('userId') userId: string,
    @Body() dto: BlockUserDto,
  ) {
    return this.profileService.blockUser(req.user.userId, userId, dto.reason);
  }

  @Delete('user/:userId/unblock')
  @UseGuards(JwtAuthGuard)
  async unblockUser(@Req() req: any, @Param('userId') userId: string) {
    return this.profileService.unblockUser(req.user.userId, userId);
  }

  @Get('users/search')
  searchUser(
    @Query('userId') query: string,
    @Query('include') include?: string,
  ) {
    if (!query || query.trim() === '') {
      return [];
    }

    return this.profileService.searchUserById(query, include);
  }

  @Get('visitors')
  @UseGuards(JwtAuthGuard)
  getMyVisitors(@Req() req) {
    return this.profileService.getVisitors(req.user.id);
  }
}
