import { IsOptional, IsString } from 'class-validator';

export class ReactivateAccountDto {
  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsString()
  password: string;
}
