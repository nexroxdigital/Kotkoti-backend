import { diskStorage } from 'multer';
import { extname } from 'path';
import { BadRequestException } from '@nestjs/common';

export const profilePicMulterConfig = {
  storage: diskStorage({
    destination: './uploads/temp',  // TEMP folder
    filename: (req, file, callback) => {
      const ext = extname(file.originalname);
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      callback(null, unique);
    },
  }),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      return callback(
        new BadRequestException('Only JPG, PNG, WEBP allowed'),
        false,
      );
    }
    callback(null, true);
  },
};
