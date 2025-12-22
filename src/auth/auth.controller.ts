import { Controller, Post, Body, UseGuards, Req, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterEmailDto } from './dto/register-email.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { SetPasswordDto } from './dto/set-password.dto';
import { CompleteProfileDto } from './dto/complete-profile.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { Request } from 'express';
import { VerifyForgotOtpDto } from './dto/verify-forgot-otp.dto';
import { SetNewPasswordDto } from './dto/set-new-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('google-verify')
  async googleVerify(@Body() body: { credential: string }) {
    return this.authService.googleLogin(body.credential);
  }

  @Post('register-email')
  async registerEmail(@Body() dto: RegisterEmailDto) {
    return this.authService.registerEmail(dto.email);
  } 

  @Post('resend-otp')
  async resendOtp(@Body() dto: ResendOtpDto) {
    return this.authService.resendOtp(dto.email);
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
    return this.authService.setPassword(dto.email, dto.password);
  }

  @Post('complete-profile')
  async completeProfile(@Body() dto: CompleteProfileDto) {
    return this.authService.completeProfile(dto);
  }

  @Post('login')
  async login(@Req() req: Request, @Body() dto: LoginDto) {
    return this.authService.login(dto, req);
  }

  @Post('refresh-token')
  async refreshToken(@Body() dto: RefreshTokenDto) {
    return this.authService.rotateRefreshToken(dto.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Req() req: any) {
    const userId = req.user.userId;
    const sessionId = req.user.sessionId;
    return this.authService.logout(userId, sessionId);
  }

  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  async logoutAll(@Req() req: any) {
    const userId = req.user.userId;
    return this.authService.logoutAll(userId);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() body: any) {
    return this.authService.forgotPassword(body);
  }

  @Post('forgot-password/resend-otp')
  async resendForgot(@Body('email') email: string) {
    return this.authService.resendForgotOtp(email);
  }

  @Post('verify-forgot-otp')
  async verifyForgotOtp(@Body() dto: VerifyForgotOtpDto) {
    return this.authService.verifyForgotOtp(dto.email, dto.otp);
  }

  @Post('set-new-password')
  async setNewPassword(@Body() dto: SetNewPasswordDto) {
    return this.authService.setNewPassword(dto.email, dto.newPassword);
  }

  @Post('reset-password')
  async resetPassword(@Body() body: any) {
    return this.authService.resetPassword(body);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(@Req() req: any, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(req.user.userId, dto);
  }

  @Get('')
  getTest() {
    return { message: 'Auth route working!' };
  }
}
