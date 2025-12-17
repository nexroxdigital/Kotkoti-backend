import {
  IsString,
  IsInt,
  IsOptional,
  IsUUID,
  IsDateString,
} from 'class-validator';

export class CreateStoreItemDto {
  @IsUUID()
  categoryId: string;

  @IsString()
  name: string;

  @IsInt()
  price: number;

  @IsString()
  icon: string;


  @IsOptional()
  @IsInt()
  validity?: number | null; // Prisma will convert to Date automatically

  @IsOptional()
  @IsString()
  swf?: string;

  @IsOptional()
  @IsInt()
  swfTime?: number;
}
