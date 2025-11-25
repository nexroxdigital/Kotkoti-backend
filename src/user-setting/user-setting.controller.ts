import { Body, Controller, Delete, Post, Req, UseGuards } from '@nestjs/common';
import { UserSettingService } from './user-setting.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { DeactivateAccountDto } from './dto/deactivate-account.dto';

@Controller('user-setting')
export class UserSettingController {
  constructor(private readonly userSettingService: UserSettingService) {}

  @Delete('me/account')
  @UseGuards(JwtAuthGuard)
  async deleteMyAccount(@Req() req: any, @Body() dto: DeleteAccountDto) {
    return this.userSettingService.deleteMyAccount(
      req.user.userId,
      dto.password,
    );
  }

}
