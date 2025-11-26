import { IsInt, Min } from 'class-validator';

export class ReorderGalleryDto {
  @IsInt()
  @Min(0)
  currentPhotoIndex: number;
}
