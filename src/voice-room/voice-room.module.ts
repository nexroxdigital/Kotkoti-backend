import { Module } from '@nestjs/common';
import { AgoraModule } from 'src/agora/agora.module';
import { VoiceRoomController } from './voice-room.controller';
import { VoiceRoomService } from './voice-room.service';

@Module({
  imports: [AgoraModule],
  controllers: [VoiceRoomController],
  providers: [VoiceRoomService],
})
export class VoiceRoomModule {}
