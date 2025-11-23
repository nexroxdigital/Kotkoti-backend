import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CompleteProfileDto } from './dto/complete-profile.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterEmailDto } from './dto/register-email.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SetPasswordDto } from './dto/set-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register-email')
  async registerEmail(@Body() dto: RegisterEmailDto) {
    const result = await this.authService.registerEmail(dto.email);
    if (result.exists) {
      return { exists: true, message: result.message };
    }
    return result;
  }

  @Post('resend-otp')
  async resendOtp(@Body() dto: ResendOtpDto) {
    const result = await this.authService.resendOtp(dto.email);

    if (result.exists) {
      return { exists: true, message: result.message };
    }

    return result;
  }

  @Post('verify-otp')
  async verifyOtp(@Req() req: any, @Body() dto: VerifyOtpDto) {
    const ip =
      req.headers['x-forwarded-for']?.split(',')[0].trim() ||
      req.ip ||
      req.connection?.remoteAddress;

    const result = await this.authService.verifyOtp(dto.email, dto.otp, ip);

    return {
      success: true,
      message: 'OTP verified',
      country: result.country,
    };
  }

  @Post('set-password')
  async setPassword(@Body() dto: SetPasswordDto) {
    return await this.authService.setPassword(dto.email, dto.password);
  }

  @Post('complete-profile')
  async completeProfile(@Body() dto: CompleteProfileDto) {
    return this.authService.completeProfile(dto);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Req() req: any) {
    const userId = req.user.userId;
    await this.authService.logout(userId);
    return { success: true, message: 'Logged out successfully' };
  }

  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(@Req() req: any, @Body() dto: ChangePasswordDto) {
    const userId = req.user.userId;
    return this.authService.changePassword(userId, dto);
  }

  @Post('refresh-token')
  async refreshToken(@Body() dto: RefreshTokenDto) {
    return this.authService.rotateRefreshToken(dto.refreshToken);
  }

  @Get('test')
  getTest() {
    return { message: 'Auth route working!' };
  }

  @Get('me')
  // @UseGuards(JwtAuthGuard)
  async getMyProfile(@Req() req: any) {
    const userId = req.user.userId;
    const userData = await this.authService.getUserData(userId);
    return { success: true, user: userData };
  }
}
