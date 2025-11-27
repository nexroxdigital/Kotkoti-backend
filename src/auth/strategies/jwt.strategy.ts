import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  // <-- ADD 'jwt' HERE
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: any) {
    const { userId, sessionId } = payload;
    if (!userId || !sessionId) {
      throw new UnauthorizedException();
    }

    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.userId !== userId) {
      throw new UnauthorizedException('Session not found or revoked');
    }

    if (session.expiresAt && session.expiresAt.getTime() < Date.now()) {
      await this.prisma.session
        .delete({ where: { id: sessionId } })
        .catch(() => {});
      throw new UnauthorizedException('Session expired');
    }

    await this.prisma.session
      .update({
        where: { id: sessionId },
        data: { lastAccessed: new Date() },
      })
      .catch(() => {});

    return { userId, sessionId, email: payload.email };
  }
}
