import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AdminModule } from './admin/admin.module';
import { AgoraModule } from './agora/agora.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { BackpackModule } from './backpack/backpack.module';
import { ImageValidationMiddleware } from './common/image-validation.middleware';
import { PrismaModule } from './prisma/prisma.module';
import { GalleryModule } from './profile/gallery/gallery.module';
<<<<<<< HEAD
import { ProfileModule } from './profile/profile.module';
import { SocialModule } from './social/social.module';
import { StoreModule } from './store/store.module';
import { UserSettingModule } from './user-setting/user-setting.module';
import { UserModule } from './user/user.module';
import { VoiceRoomModule } from './voice-room/voice-room.module';
=======
import { AdminModule } from './admin/admin.module';
import { CoinResellerModule } from './coin-reseller/coin-reseller.module';
>>>>>>> dc2306b2106cd86de8a54d4a24b5358ecb998490

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

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
<<<<<<< HEAD

    AgoraModule,

    VoiceRoomModule,
=======
    CoinResellerModule,
>>>>>>> dc2306b2106cd86de8a54d4a24b5358ecb998490
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ImageValidationMiddleware)
      .forRoutes('profile/upload/profile-picture');
  }
}
