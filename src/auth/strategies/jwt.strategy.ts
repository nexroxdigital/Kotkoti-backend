import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from 'src/prisma/prisma.service';


@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: any) {
    // payload = { userId, email, sessionId, iat, exp }
    const { userId, sessionId } = payload;
    if (!userId || !sessionId) {
      throw new UnauthorizedException();
    }

    // check session exists and not expired
    const session = await this.prisma.session.findUnique({ where: { id: sessionId } });
    if (!session || session.userId !== userId) {
      throw new UnauthorizedException('Session not found or revoked');
    }
    if (session.expiresAt && session.expiresAt.getTime() < Date.now()) {
      // remove expired session
      await this.prisma.session.delete({ where: { id: sessionId } }).catch(()=>{});
      throw new UnauthorizedException('Session expired');
    }

    // optionally update lastAccessed here or in middleware
    await this.prisma.session.update({
      where: { id: sessionId },
      data: { lastAccessed: new Date() }
    }).catch(()=>{});

    // return a minimal user object used in req.user
    return { userId, sessionId, email: payload.email };
  }
}
