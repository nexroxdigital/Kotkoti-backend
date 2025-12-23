import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  nickName: string;

  @IsEmail()
  email: string;

  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  profilePicture?: string;

  @IsString()
  password: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsDateString()
  dob?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  vipId?: string; // corresponds to Vip relation

  @IsOptional()
  @IsInt()
  @Min(0)
  gold?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  diamond?: number;

  @IsOptional()
  @IsBoolean()
  isDiamondBlocked?: boolean;

  @IsOptional()
  @IsBoolean()
  isGoldBlocked?: boolean;

  @IsOptional()
  @IsBoolean()
  isAccountBlocked?: boolean;

  @IsOptional()
  @IsString()
  agencyId?: string;

  @IsOptional()
  @IsBoolean()
  isHost?: boolean;

  @IsOptional()
  @IsBoolean()
  isReseller?: boolean;

  @IsOptional()
  @IsString()
  deviceId?: string;

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  @IsString()
  charmLevelId?: string;

  @IsOptional()
  @IsString()
  wealthLevelId?: string;

  @IsOptional()
  @IsDateString()
  lastLoginAt?: string;
}
