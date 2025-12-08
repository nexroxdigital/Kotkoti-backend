import { IsInt, IsOptional, IsString } from 'class-validator';
// MAIN SVIP DTOs
export class CreateSvipDto {
  @IsString()
  levelName: string;

  @IsString()
  levelNo: string;

  @IsInt()
  needPoint: number;

  @IsInt()
  expireDuration: number;

  @IsOptional()
  @IsString()
  img?: string;

  @IsOptional()
  @IsString()
  swf?: string;

  @IsOptional()
  @IsInt()
  swfTime?: number;
}

export class UpdateSvipDto {
  @IsOptional()
  @IsString()
  levelName?: string;

  @IsOptional()
  @IsString()
  levelNo?: string;

  @IsOptional()
  @IsInt()
  needPoint?: number;

  @IsOptional()
  @IsInt()
  expireDuration?: number;

  @IsOptional()
  @IsString()
  img?: string;

  @IsOptional()
  @IsString()
  swf?: string;

  @IsOptional()
  @IsInt()
  swfTime?: number;
}

// POWER PRIVILEGE
export class AddPowerPrivilegeDto {
  @IsString()
  powerName: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  swf?: string;

  @IsOptional()
  @IsInt()
  swfTime?: number;
}

// MEDIA PRIVILEGE
export class AddMediaPrivilegeDto {
  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  swf?: string;

  @IsOptional()
  @IsInt()
  swfTime?: number;
}
