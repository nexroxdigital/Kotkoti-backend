// import {
//   Injectable,
//   type OnModuleDestroy,
//   type OnModuleInit,
//   Logger,
// } from '@nestjs/common';
// import { PrismaClient } from '@prisma/client';
// import { PrismaPg } from '@prisma/adapter-pg';
// //import { withOptimize } from '@prisma/extension-optimize';
// import { Pool } from 'pg';

// @Injectable()
// export class PrismaService
//   extends PrismaClient
//   implements OnModuleInit, OnModuleDestroy
// {
//   private readonly logger = new Logger(PrismaService.name);
//   private pool: Pool;

//   constructor() {
//     // Optimized connection pool for Neon PostgreSQL
//     const pool = new Pool({
//       connectionString: process.env.DATABASE_URL,
//       // Connection pool settings
//       max: 20, // Maximum number of clients in the pool
//       min: 5, // Minimum number of clients in the pool
//       idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
//       connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection cannot be established
//       // Neon-specific optimizations
//       keepAlive: true,
//       keepAliveInitialDelayMillis: 10000,
//       // Statement timeout (prevent long-running queries)
//       statement_timeout: 30000, // 30 seconds max per query
//     });

//     // Error handling for pool
//     pool.on('error', (err) => {
//       console.error('Unexpected error on idle client', err);
//     });

//     const adapter = new PrismaPg(pool);

//     super({
//       adapter,
//       log: [
//         { emit: 'event', level: 'query' },
//         { emit: 'event', level: 'error' },
//         { emit: 'event', level: 'warn' },
//       ],
//     });

//     // 🔹 Apply Prisma Optimize ONCE, globally
//     if (process.env.OPTIMIZE_API_KEY) {
//       this.$extends(
//         withOptimize({
//           apiKey: process.env.OPTIMIZE_API_KEY,
//         }),
//       );
//     } else {
//       this.logger.warn(
//         'OPTIMIZE_API_KEY is not set. Prisma Optimize is disabled.',
//       );
//     }

//     this.pool = pool;
//   }

//   async onModuleInit() {
//     await this.$connect();
//     this.logger.log('Database connected successfully');
//   }

//   async onModuleDestroy() {
//     await this.$disconnect();
//     await this.pool.end();
//     this.logger.log('Database disconnected');
//   }
// }



import {
  Injectable,
  type OnModuleDestroy,
  type OnModuleInit,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private pool: Pool;

  constructor() {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,

      max: 20,
      min: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,

      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,

      statement_timeout: 30000,
    });

    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });

    const adapter = new PrismaPg(pool);

    super({
      adapter,
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'warn' },
      ],
    });

    this.pool = pool;
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Database connected successfully');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end();
    this.logger.log('Database disconnected');
  }
}
