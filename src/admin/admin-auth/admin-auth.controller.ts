import { Body, Controller, Param, Post } from '@nestjs/common';
import { AdminAuthService } from './admin-auth.service';
import { CreateEmployeeDto } from './dto/register-employee.dto';
import { LoginEmployeeDto } from './dto/login-employee.dto';

@Controller('admin-auth')
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @Post('register')
  async register(@Body() createEmployeeDto: CreateEmployeeDto) {
    return this.adminAuthService.registerEmployee(createEmployeeDto);
  }

  @Post('login')
  async login(@Body() loginEmployeeDto: LoginEmployeeDto) {
    return this.adminAuthService.login(loginEmployeeDto);
  }

  @Post('logout/:employeeId')
  logout(@Param('employeeId') employeeId: string) {
    return this.adminAuthService.logout(employeeId);
  }
}
