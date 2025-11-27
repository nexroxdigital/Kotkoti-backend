import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Observable } from 'rxjs';

@Injectable()
export class SessionActivityInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const req = context.switchToHttp().getRequest();
    const user = req.user;
    if (user?.sessionId) {
      // fire-and-forget update
      this.prisma.session
        .update({
          where: { id: user.sessionId },
          data: { lastAccessed: new Date() },
        })
        .catch(() => {});
    }
    return next.handle();
  }
}
