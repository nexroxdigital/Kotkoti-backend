import { IsString, IsInt, IsOptional, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateStoreItemDto {
  @IsUUID()
  categoryId: string;

  @IsString()
  name: string;

  @Type(() => Number)
  @IsInt()
  price: number;

  @IsOptional()
  @IsString()
  icon: string;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  validity?: number | null;

  @IsOptional()
  @IsString()
  swf?: string;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  swftime?: number;
}
