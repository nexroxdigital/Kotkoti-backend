import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateEmployeeDto } from './dto/register-employee.dto';
import * as bcrypt from 'bcrypt';
import { LoginEmployeeDto } from './dto/login-employee.dto';
import { JwtService } from '@nestjs/jwt';

import { ConfigService } from '@nestjs/config';

@Injectable()
export class AdminAuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async registerEmployee(data: CreateEmployeeDto) {
    const existingUser = await this.prisma.employee.findUnique({
      where: { email: data.email },
    });
    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const hashedPassword = await this.hashPassword(data.password);

    const user = await this.prisma.employee.create({
      data: {
        ...data,
        password: hashedPassword,
      },
    });

    const { password, ...safeUser } = user;

    console.log(safeUser);
    return safeUser;
  }

  async login(dto: LoginEmployeeDto) {
    const employee = await this.prisma.employee.findUnique({
      where: { email: dto.email },
    });

    if (!employee) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.comparePassword(
      dto.password,
      employee.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // generate tokens
    const { accessToken, refreshToken } = this.generateTokens(
      employee.id,
      employee.email,
      employee.role,
    );

    // store refresh token in DB for
    await this.prisma.employee.update({
      where: { id: employee.id },
      data: { refreshToken },
    });

    // return safe user info
    const { password, ...safeEmployee } = employee;

    console.log(safeEmployee);
    console.log('token', accessToken);
    console.log('refreshToken', refreshToken);
    return {
      message: 'Login successful',
      employee: safeEmployee,
      accessToken,
      refreshToken,
    };
  }

  private generateTokens(userId: string, email: string, role: string) {
    const accessToken = this.jwtService.sign(
      {
        sub: userId,
        email,
        role,
      },
      {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: '15m',
      },
    );

    const refreshToken = this.jwtService.sign(
      { sub: userId },
      {
        secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
        expiresIn: '7d',
      },
    );

    return { accessToken, refreshToken };
  }

  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  private async comparePassword(
    password: string,
    hash: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
