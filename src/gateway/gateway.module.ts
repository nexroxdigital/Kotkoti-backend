import { Module } from '@nestjs/common';
import { RoomGateway } from './room.gateway';
import { SeatsModule } from '../seats/seats.module';
import { ParticipantsModule } from '../participants/participants.module';
import { ChatGateway } from './chat.gateway';
import { ProfileModule } from '../profile/profile.module';

@Module({
  imports: [SeatsModule, ParticipantsModule, ProfileModule],
  providers: [RoomGateway, ChatGateway],
  exports: [RoomGateway],
})
export class GatewayModule {}
