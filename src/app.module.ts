import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PostModule } from './post/post.module';
import { PrismaModule } from './prisma/prisma.module';
import { SocialModule } from './social/social.module';
import { UserModule } from './user/user.module';
import { ProfileModule } from './profile/profile.module';
import { ImageValidationMiddleware } from './common/image-validation.middleware';
import { UserSettingModule } from './user-setting/user-setting.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    PrismaModule,
    PostModule,
    AuthModule,
    ProfileModule,
    UserModule,
    SocialModule,
    UserSettingModule,
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
