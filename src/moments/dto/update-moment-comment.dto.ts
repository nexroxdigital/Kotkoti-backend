import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateMomentCommentDto {
  @IsString()
  @IsNotEmpty()
  content: string;
}
