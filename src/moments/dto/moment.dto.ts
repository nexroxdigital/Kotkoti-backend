import { IsOptional, IsString } from 'class-validator';

export class CreateMomentDto {
  @IsOptional()
  @IsString()
  caption?: string;

  @IsOptional()
  images?: string[];

  @IsOptional()
  video?: string;
}

export class UpdateMomentDto {
  @IsOptional()
  @IsString()
  caption?: string;
}
