import {
  Controller,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Post,
  Get,
  Delete,
  Param,
  Req,
  Body,
  Put,
  Query,
  Patch,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { GalleryService } from './gallery.service';
import { galleryMulterConfig } from 'src/common/multer.config';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ReorderGalleryDto } from './dto/reorder-gallery.dto';

@Controller('profile')
export class GalleryController {
  constructor(private readonly galleryService: GalleryService) {}

  // single file upload (adds to gallery at index 0)
  @Post('gallery/upload-single')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', galleryMulterConfig))
  async uploadToGallery(
    @Req() req: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.galleryService.uploadToGallery(req.user.userId, file);
  }

  // multiple files upload
  @Post('gallery/upload-multiple')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('files', 10, galleryMulterConfig))
  async uploadMultiple(
    @Req() req: any,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.galleryService.uploadMultipleToGallery(req.user.userId, files);
  }

  // list gallery
  @Get('gallery')
  @UseGuards(JwtAuthGuard)
  async list(
    @Req() req: any,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.galleryService.listGallery(req.user.userId, {
      limit: Number(limit) || 50,
      offset: Number(offset) || 0,
    });
  }

  // set an image as active cover
  @Post('gallery/:id/set-cover')
  @UseGuards(JwtAuthGuard)
  async setActive(@Req() req: any, @Param('id') id: string) {
    return this.galleryService.setActiveCover(req.user.userId, id);
  }

  // reorder: client sends new ordered array of photo ids (index 0 first)
  /*   @Put('gallery/reorder/:photoId')
  @UseGuards(JwtAuthGuard)
  async reorderOne(
    @Req() req: any,
    @Param('photoId') photoId: string,
    @Body() dto: ReorderGalleryDto,
  ) {
    return this.galleryService.reorderSingle(
      req.user.userId,
      photoId,
      dto.currentPhotoIndex,
    );
  }
 */

  @Post('gallery/reorder')
  @UseGuards(JwtAuthGuard)
  reorderGallery(
    @Req() req,
    @Body('orderedPhotoIds') orderedPhotoIds: string[],
  ) {
    return this.galleryService.reorderByList(req.user.userId, orderedPhotoIds);
  }


  // delete photo
  @Delete('gallery/:id')
  @UseGuards(JwtAuthGuard)
  async deletePhoto(@Req() req: any, @Param('id') id: string) {
    return this.galleryService.deletePhoto(req.user.userId, id);
  }
}
