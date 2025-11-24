import { Module, Session } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { MailModule } from '../mail/mail.module';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';
import { SessionsController } from './sessions.controller';

@Module({
  imports: [
    PrismaModule,
    MailModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'default-secret',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [AuthController, SessionsController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
