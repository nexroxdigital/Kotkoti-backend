import {
  Injectable,
  NestMiddleware,
  BadRequestException,
} from '@nestjs/common';

import * as fs from 'fs';
import sharp from 'sharp';

@Injectable()
export class ImageValidationMiddleware implements NestMiddleware {
  async use(req: any, res: any, next: () => void) {
    const file = req.file;

    if (!file) return next(); // no file uploaded

    try {
      // Validate MIME type
      const allowed = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowed.includes(file.mimetype)) {
        fs.unlinkSync(file.path);
        throw new BadRequestException('Invalid image type.');
      }

      // Validate Sharp metadata
      const meta = await sharp(file.path).metadata();

      if (!meta.width || !meta.height) {
        fs.unlinkSync(file.path);
        throw new BadRequestException('Invalid image file.');
      }

      // Validate minimum dimensions
      if (meta.width < 200 || meta.height < 200) {
        fs.unlinkSync(file.path);
        throw new BadRequestException(
          'Image too small. Minimum 200x200 required.',
        );
      }

      next();
    } catch (error) {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      throw error;
    }
  }
}
