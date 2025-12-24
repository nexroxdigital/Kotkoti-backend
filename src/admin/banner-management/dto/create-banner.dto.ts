import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateBannerDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  link?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return false; // default value
  })
  @IsBoolean()
  @IsOptional()
  isGlobal?: boolean = false;

  @IsString()
  @IsOptional()
  imgUrl: string;
}
