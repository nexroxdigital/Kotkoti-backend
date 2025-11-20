import { Controller, Post, Body, Get } from '@nestjs/common';
import { RegisterEmailDto } from './dto/register-email.dto';
import { AuthService } from './auth.service';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { SetPasswordDto } from './dto/set-password.dto';
import { CompleteProfileDto } from './dto/complete-profile.dto';

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
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    await this.authService.verifyOtp(dto.email, dto.otp);
    return { success: true, message: 'OTP verified' };
  }

  @Post('set-password')
  async setPassword(@Body() dto: SetPasswordDto) {
    return await this.authService.setPassword(dto.email, dto.password);
  }


  @Post('complete-profile')
async completeProfile(@Body() dto: CompleteProfileDto) {
  return this.authService.completeProfile(dto);
}


  @Get('test')
  getTest() {
    return { message: 'Auth route working!' };
  }
}
