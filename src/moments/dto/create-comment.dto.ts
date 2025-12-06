import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  content: string;
}

export class CreateCommentReplyDto {
  @IsNotEmpty()
  @IsString()
  content: string;
}

export class UpdateCommentReplyDto {
  @IsNotEmpty()
  @IsString()
  content: string;
}
