import { Module } from '@nestjs/common';
import { SeatsService } from './seats.service';
import { SeatsRepository } from './seats.repository';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [SeatsService, SeatsRepository],
  exports: [SeatsService],
})
export class SeatsModule {}
