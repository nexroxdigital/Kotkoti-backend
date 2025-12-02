import { Module } from '@nestjs/common';
import { RoomsController } from './rooms.controller';
import { RoomsService } from './rooms.service';
import { RoomBanService } from './room-ban.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RtcModule } from '../rtc/rtc.module';
import { SeatsModule } from '../seats/seats.module';
import { ParticipantsModule } from '../participants/participants.module';

@Module({
  imports: [PrismaModule, RtcModule, SeatsModule, ParticipantsModule],
  controllers: [RoomsController],
  providers: [RoomsService, RoomBanService],
  exports: [RoomsService, RoomBanService],
})
export class RoomsModule {}
