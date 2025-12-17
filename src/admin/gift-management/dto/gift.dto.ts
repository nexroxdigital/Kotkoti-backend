import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateGiftDto {
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  needCoin: number;

  @IsString()
  @IsOptional()
  giftIcon: string;

  @IsString()
  @IsOptional()
  swf: string;

  @IsString()
  @IsNotEmpty()
  swfTime: string;

  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @IsNotEmpty()
  worldMsg: boolean;

  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @IsNotEmpty()
  isSound: boolean;
}

export class UpdateGiftDto {
  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  type?: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  needCoin?: number;

  @IsString()
  @IsOptional()
  giftIcon?: string;

  @IsString()
  @IsOptional()
  swf?: string;

  @IsString()
  @IsOptional()
  swfTime?: string;

  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @IsOptional()
  worldMsg?: boolean;

  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @IsOptional()
  isSound?: boolean;
}
