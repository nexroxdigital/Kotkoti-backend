import { Module } from '@nestjs/common';
import { RoomGateway } from './room.gateway';
import { SeatsModule } from '../seats/seats.module';
import { ParticipantsModule } from '../participants/participants.module';

@Module({
  imports: [SeatsModule, ParticipantsModule],
  providers: [RoomGateway],
  exports: [RoomGateway],
})
export class GatewayModule {}
