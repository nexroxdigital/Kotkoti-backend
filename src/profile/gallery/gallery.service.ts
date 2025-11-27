import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import * as fs from 'fs';

import { join } from 'path';
import sharp from 'sharp';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class GalleryService {
  constructor(private prisma: PrismaService) {}

  private galleryDir() {
    return join(process.cwd(), 'uploads', 'gallery');
  }

  // helper to process and move file -> webp
  private async processAndSave(tempPath: string, finalFilename: string) {
    const outDir = this.galleryDir();
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const finalPath = join(outDir, finalFilename);
    await sharp(tempPath)
      .resize(1200, 400, { fit: 'cover', position: 'center' })
      .webp({ quality: 80 })
      .toFile(finalPath);
    // remove temp
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    return `/uploads/gallery/${finalFilename}`;
  }

  // ----------------------------------
  // SINGLE upload
  // ----------------------------------

  async uploadToGallery(userId: string, file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');

    // prepare filename
    const finalFilename = `${userId}-${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;
    const url = await this.processAndSave(file.path, finalFilename);

    // transaction: increment existing orders, then insert new with orderIdx = 0
    await (this.prisma as any).$transaction(async (prisma) => {
      await prisma.coverPhoto.updateMany({
        where: { userId },
        data: { orderIdx: { increment: 1 } },
      });

      await prisma.coverPhoto.create({
        data: {
          userId,
          url,
          orderIdx: 0,
        },
      });
    });

    // Optionally: return first page of gallery or created photo
    const created = await (this.prisma as any).coverPhoto.findFirst({
      where: { userId, url },
    });
    return { message: 'Uploaded', photo: created };
  }

  // ----------------------------------
  // MULTIPLE upload
  // ----------------------------------

  async uploadMultipleToGallery(userId: string, files: Express.Multer.File[]) {
    if (!files || files.length === 0)
      throw new BadRequestException('No files uploaded');
    const saved: any = [];

    // Use transaction: we will push each as new index 0 in order of files array (first file becomes index 0 final)
    await (this.prisma as any).$transaction(async (prisma) => {
      // increment existing orders by files.length
      await prisma.coverPhoto.updateMany({
        where: { userId },
        data: { orderIdx: { increment: files.length } },
      });

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const finalFilename = `${userId}-${Date.now()}-${i}-${Math.random().toString(36).slice(2)}.webp`;
        const url = await this.processAndSave(file.path, finalFilename);

        const record = await prisma.coverPhoto.create({
          data: { userId, url, orderIdx: i }, // first file -> 0, second -> 1, etc
        });

        saved.push(record);
      }
    });

    return { message: 'Uploaded multiple', photos: saved };
  }

  // ----------------------------------
  // list gallery (ordered: orderIdx asc => index 0 first)
  // ----------------------------------

  async listGallery(userId: string, opts: { limit: number; offset: number }) {
    const items = await (this.prisma as any).coverPhoto.findMany({
      where: { userId },
      orderBy: [{ orderIdx: 'asc' }, { createdAt: 'desc' }],
      skip: opts.offset,
      take: opts.limit,
    });
    const total = await (this.prisma as any).coverPhoto.count({
      where: { userId },
    });
    return { items, total, limit: opts.limit, offset: opts.offset };
  }

  // ----------------------------------
  // Set cover from gallery photo
  // ----------------------------------

  async setActiveCover(userId: string, photoId: string) {
    const photo = await (this.prisma as any).coverPhoto.findUnique({
      where: { id: photoId },
    });
    if (!photo || photo.userId !== userId)
      throw new NotFoundException('Photo not found');

    // set user's activeCoverId and optional coverImage url
    await (this.prisma as any).user.update({
      where: { id: userId },
      data: {
        coverImage: photo.url, // if you store URL as coverImage as well
      },
    });

    return { message: 'Active cover updated', activeCover: photo };
  }

  // ----------------------------------
  // reorder gallery: orderedIds[0] -> orderIdx 0, etc.
  // ----------------------------------

  async reorderByList(userId: string, orderedPhotoIds: string[]) {
    if (!orderedPhotoIds || orderedPhotoIds.length === 0) {
      throw new BadRequestException('Photo list is empty');
    }

    // 1. Load all photos of this user
    const dbPhotos = await this.prisma.coverPhoto.findMany({
      where: { userId },
      select: { id: true },
    });

    if (!dbPhotos.length) {
      throw new BadRequestException('No photos found');
    }

    const dbIds = dbPhotos.map((p) => p.id);

    // 2. Validate ownership (make sure incoming ids belong to user)
    const invalid = orderedPhotoIds.filter((id) => !dbIds.includes(id));
    if (invalid.length > 0) {
      throw new BadRequestException(`Invalid photo ids: ${invalid.join(', ')}`);
    }

    // 3. Validate count
    if (dbIds.length !== orderedPhotoIds.length) {
      throw new BadRequestException('Photo list does not match database');
    }

    // 4. Transaction update (atomic)
    const updates = orderedPhotoIds.map((id, index) =>
      this.prisma.coverPhoto.update({
        where: { id },
        data: { orderIdx: index },
      }),
    );

    await this.prisma.$transaction(updates);

    // 5. Fetch updated list
    const updatedGallery = await this.prisma.coverPhoto.findMany({
      where: { userId },
      orderBy: { orderIdx: 'asc' },
    });

    return {
      message: 'Gallery reordered successfully',
      gallery: updatedGallery,
    };
  }

  // ----------------------------------
  // delete photo
  // ----------------------------------

  async deletePhoto(userId: string, photoId: string) {
    const photo = await (this.prisma as any).coverPhoto.findUnique({
      where: { id: photoId },
    });
    if (!photo || photo.userId !== userId)
      throw new NotFoundException('Photo not found');

    const filePath = join(process.cwd(), photo.url);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    // if this was active cover, clear activeCoverId and coverImage
    const user = await (this.prisma as any).user.findUnique({
      where: { id: userId },
    });
    if (user?.activeCoverId === photoId) {
      await (this.prisma as any).user.update({
        where: { id: userId },
        data: { activeCoverId: null, coverImage: null },
      });
    }

    // delete record
    await (this.prisma as any).coverPhoto.delete({ where: { id: photoId } });

    // After deletion, you may want to re-index remaining photos (make order contiguous)
    const remaining = await (this.prisma as any).coverPhoto.findMany({
      where: { userId },
      orderBy: [{ orderIdx: 'asc' }],
    });

    const tx = remaining.map((p, idx) =>
      (this.prisma as any).coverPhoto.update({
        where: { id: p.id },
        data: { orderIdx: idx },
      }),
    );
    if (tx.length) await this.prisma.$transaction(tx);

    return { message: 'Photo deleted' };
  }
}
