import { Module } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';
import { GalleryModule } from './gallery/gallery.module';

@Module({
  imports: [GalleryModule],
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}
