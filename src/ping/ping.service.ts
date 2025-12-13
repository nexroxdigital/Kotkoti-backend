import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PingService {
  constructor(private readonly prisma: PrismaService) {}

  ping() {
    return {
      message: 'pong',
      timestamp: new Date().toISOString(),
    };
  }

  async checkDb() {
    const start = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      const end = Date.now();
      return {
        status: 'ok',
        latency: `${end - start}ms`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
