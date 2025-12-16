import { Module } from '@nestjs/common';
import { RoomGateway } from './room.gateway';
import { SeatsModule } from '../seats/seats.module';
import { ParticipantsModule } from '../participants/participants.module';
import { ChatGateway } from './chat.gateway';

@Module({
  imports: [SeatsModule, ParticipantsModule],
  providers: [RoomGateway, ChatGateway],
  exports: [RoomGateway],
})
export class GatewayModule {}
