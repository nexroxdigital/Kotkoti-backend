import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname } from 'path';

export const profilePicMulterConfig = {
  storage: diskStorage({
    destination: './uploads/temp', // TEMP folder
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

export const coverPicMulterConfig = {
  storage: diskStorage({
    destination: './uploads/cover',
    filename: (req, file, callback) => {
      const ext = extname(file.originalname);
      const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      callback(null, uniqueName);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req: any, file: Express.Multer.File, callback: any) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      return callback(new BadRequestException('Invalid image type'), false);
    }
    callback(null, true);
  },
};

export const galleryMulterConfig = {
  storage: diskStorage({
    destination: './uploads/temp',
    filename: (req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`;
      cb(null, unique);
    },
  }),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB per image
  fileFilter: (req: any, file: Express.Multer.File, cb: any) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new BadRequestException('Only JPG/PNG/WEBP allowed'), false);
    }
    cb(null, true);
  },
};

export const momentFilesInterceptorConfig = {
  storage: diskStorage({
    destination: (req, file, cb) => {
      if (file.fieldname === 'images')
        cb(null, './uploads/moments'); // images folder
      else if (file.fieldname === 'video')
        cb(null, './uploads/moments/videos'); // video folder
      else cb(new BadRequestException('Unknown fieldname'), '');
    },
    filename: (req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`;
      cb(null, unique);
    },
  }),
  fileFilter: (req: any, file: Express.Multer.File, cb: any) => {
    // Allowed file types same as your old configs
    const allowedImages = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/jpg',
    ];
    const allowedVideos = ['video/mp4', 'video/mkv', 'video/webm'];

    if (file.fieldname === 'images' && !allowedImages.includes(file.mimetype)) {
      return cb(
        new BadRequestException('Only JPG/PNG/WEBP allowed for images'),
        false,
      );
    }

    if (file.fieldname === 'video' && !allowedVideos.includes(file.mimetype)) {
      return cb(
        new BadRequestException('Only MP4/MKV/WEBM allowed for video'),
        false,
      );
    }

    cb(null, true); // allow file
  },
  limits: {
    fileSize: 50 * 1024 * 1024, // max 50MB per file (matches video limit)
  },
};

// for just images
export const svipMulterConfig = {
  storage: diskStorage({
    destination: './uploads/svip',
    filename: (req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`;
      cb(null, unique);
    },
  }),

  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB per image

  fileFilter: (req: any, file: Express.Multer.File, cb: any) => {
    const allowed = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/jpg',
      'image/svga',
    ];
    if (!allowed.includes(file.mimetype)) {
      return cb(new BadRequestException('Only JPG/PNG/WEBP allowed'), false);
    }
    cb(null, true);
  },
};

// for just images
// export const momentMulterConfig = {
//   storage: diskStorage({
//     destination: './uploads/moments',
//     filename: (req, file, cb) => {
//       const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`;
//       cb(null, unique);
//     },
//   }),
//   limits: { fileSize: 8 * 1024 * 1024 }, // 8MB per image
//   fileFilter: (req: any, file: Express.Multer.File, cb: any) => {
//     const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
//     if (!allowed.includes(file.mimetype)) {
//       return cb(new BadRequestException('Only JPG/PNG/WEBP allowed'), false);
//     }
//     cb(null, true);
//   },
// };

// for just video
// export const momentVideoMulterConfig = {
//   storage: diskStorage({
//     destination: './uploads/moments/videos',
//     filename: (req, file, cb) => {
//       const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`;
//       cb(null, unique);
//     },
//   }),
//   limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max per video
//   fileFilter: (req: any, file: Express.Multer.File, cb: any) => {
//     const allowed = ['video/mp4', 'video/mkv', 'video/webm'];
//     if (!allowed.includes(file.mimetype)) {
//       return cb(new BadRequestException('Only MP4/MKV/WEBM allowed'), false);
//     }
//     cb(null, true);
//   },
// };
