import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AdminModule } from './admin/admin.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { BackpackModule } from './backpack/backpack.module';
import { CoinResellerModule } from './coin-reseller/coin-reseller.module';
import { PrismaModule } from './prisma/prisma.module';
import { GalleryModule } from './profile/gallery/gallery.module';
import { ProfileModule } from './profile/profile.module';
import { RtcModule } from './rtc/rtc.module';
import { SocialModule } from './social/social.module';
import { StoreModule } from './store/store.module';
import { UserSettingModule } from './user-setting/user-setting.module';
import { UserModule } from './user/user.module';

import { RoomsModule } from './audio-room/rooms.module';
import { ImageValidationMiddleware } from './common/image-validation.middleware';
import { GatewayModule } from './gateway/gateway.module';
import { RoomGateway } from './gateway/room.gateway';
import { GiftModule } from './gift/gift.module';
import { ParticipantsModule } from './participants/participants.module';
import { SeatsModule } from './seats/seats.module';
import { LuckyBagModule } from './lucky-bag/lucky-bag.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    PrismaModule,
    AuthModule,
    ProfileModule,
    UserModule,
    SocialModule,
    UserSettingModule,
    GalleryModule,
    StoreModule,
    AdminModule,
    BackpackModule,
    CoinResellerModule,
    RtcModule,
    GatewayModule,
    RoomsModule,
    SeatsModule,
    ParticipantsModule,
    GiftModule,
    LuckyBagModule,
  ],

  controllers: [AppController],

  providers: [AppService, RoomGateway],

  exports: [RoomGateway],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ImageValidationMiddleware)
      .forRoutes('profile/upload/profile-picture');
  }
}
