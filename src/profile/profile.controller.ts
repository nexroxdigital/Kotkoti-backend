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
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UpdateMeDto } from './dto/update-me.dto';
import { ProfileService } from './profile.service';
import { BlockUserDto } from './dto/block.dto';

@Controller('profile')
export class ProfileController {
  constructor(private readonly authService: ProfileService) {}

  @Get('view/me')
  @UseGuards(JwtAuthGuard)
  async viewMe(@Req() req: any, @Query('expand') expand?: string) {
    return this.authService.viewMe(req.user.userId, expand);
  }

  @Get('user/:userId/public-profile')
  async getPublicProfile(@Param('userId') userId: string) {
    return this.authService.getPublicProfile(userId);
  }

  @Put('update/me')
  @UseGuards(JwtAuthGuard)
  async updateMe(@Req() req: any, @Body() dto: UpdateMeDto) {
    return this.authService.updateMe(req.user.userId, dto);
  }

  @Get('user/blocked')
  @UseGuards(JwtAuthGuard)
  async getBlocked(
    @Req() req: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.authService.getBlockedUsers(req.user.userId, page, limit);
  }

  @Post('user/:userId/block')
  @UseGuards(JwtAuthGuard)
  async blockUser(
    @Req() req: any,
    @Param('userId') userId: string,
    @Body() dto: BlockUserDto,
  ) {
    return this.authService.blockUser(req.user.userId, userId, dto.reason);
  }

  @Delete('users/:userId/unblock')
  @UseGuards(JwtAuthGuard)
  async unblockUser(@Req() req: any, @Param('userId') userId: string) {
    return this.authService.unblockUser(req.user.userId, userId);
  }
}
