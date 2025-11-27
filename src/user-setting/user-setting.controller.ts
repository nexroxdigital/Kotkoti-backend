import { Body, Controller, Delete, Post, Req, UseGuards } from '@nestjs/common';
import { UserSettingService } from './user-setting.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { DeactivateAccountDto } from './dto/deactivate-account.dto';
import { ReactivateAccountDto } from './dto/reactivate-account.dto';

@Controller('user-setting')
export class UserSettingController {
  constructor(private readonly userSettingService: UserSettingService) {}

  @Delete('me/account-delete')
  @UseGuards(JwtAuthGuard)
  async deleteMyAccount(@Req() req: any, @Body() dto: DeleteAccountDto) {
    return this.userSettingService.deleteMyAccount(
      req.user.userId,
      dto.password,
    );
  }

  @Post('me/deactivate')
  @UseGuards(JwtAuthGuard)
  async deactivateAccount(@Req() req: any, @Body() dto: DeactivateAccountDto) {
    return this.userSettingService.deactivateMyAccount(req.user.userId, dto);
  }

  @Post('me/reactivate')
  async reactivateAccount(@Body() dto: ReactivateAccountDto, @Req() req: any) {
    return this.userSettingService.reactivateAccount(dto, req);
  }
}
