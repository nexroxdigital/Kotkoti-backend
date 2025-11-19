import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

//makes the module as globally scoped
@Global()
@Module({
  providers: [PrismaService],

  exports: [PrismaService],
})
export class PrismaModule {}
