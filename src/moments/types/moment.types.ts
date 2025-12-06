import { CreateMomentDto } from '../dto/moment.dto';

export interface MomentCreateInput extends CreateMomentDto {
  userId: string;
  files?: Express.Multer.File[];
  videoFile?: Express.Multer.File;
}
