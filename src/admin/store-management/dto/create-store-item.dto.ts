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

  @IsString()
  type: string;

  @IsOptional()
  @IsDateString()
  validity?: string; // Prisma will convert to Date automatically
}
