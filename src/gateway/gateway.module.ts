import { Module } from '@nestjs/common';
import { RoomGateway } from './room.gateway';

import { PrismaModule } from '../prisma/prisma.module';
import { SeatsModule } from 'src/seats/seats.module';
import { ParticipantsModule } from 'src/participants/participants.module';
import { RoomsModule } from 'src/audio-room/rooms.module';

@Module({
  imports: [SeatsModule, ParticipantsModule, RoomsModule, PrismaModule],
  providers: [RoomGateway],
  exports: [RoomGateway],
})
export class GatewayModule {}
