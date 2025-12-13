import { Module } from '@nestjs/common';
import { SeatsService } from './seats.service';
import { SeatsRepository } from './seats.repository';
import { PrismaModule } from '../prisma/prisma.module';
import { RtcModule } from '../rtc/rtc.module';   // <-- ADD THIS

@Module({
  imports: [
    PrismaModule, RtcModule ],
  providers: [SeatsService, SeatsRepository],
  exports: [SeatsService],
})
export class SeatsModule {}
