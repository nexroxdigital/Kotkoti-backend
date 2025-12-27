import { IsString, IsInt, IsOptional, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

// DTO for CharmLevelPrivilege and WealthLevelPrivilege
export class CreateLevelPrivilegeDto {
  @IsString()
  levelId: string; // charmLevelId or wealthLevelId

  @IsOptional()
  @IsString()
  storeItemsId?: string;

  @IsOptional()
  @IsBoolean()
  isPower?: boolean;

  @IsOptional()
  @IsBoolean()
  canCreateFamily?: boolean;

  @IsOptional()
  @IsInt()
  roomAdminLimit?: number;
}

export class UpdateLevelPrivilegeDto {
  @IsOptional()
  @IsString()
  storeItemsId?: string;

  @IsOptional()
  @IsBoolean()
  isPower?: boolean;

  @IsOptional()
  @IsBoolean()
  canCreateFamily?: boolean;

  @IsOptional()
  @IsInt()
  roomAdminLimit?: number;
}

// DTO for CharmLevel
export class CreateCharmLevelDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @Type(() => Number)
  @IsInt()
  levelup_point: number;

  @Type(() => Number)
  @IsInt()
  levelNo: number;
}

export class UpdateCharmLevelDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  levelup_point?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  levelNo?: number;
}

// DTO for WealthLevel
export class CreateWealthLevelDto {
  @IsString()
  name: string;

  @IsString()
  imageUrl: string;

  @IsInt()
  levelup_point: number;

  @IsInt()
  levelNo: number;
}

export class UpdateWealthLevelDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsInt()
  levelup_point?: number;

  @IsOptional()
  @IsInt()
  levelNo?: number;
}
