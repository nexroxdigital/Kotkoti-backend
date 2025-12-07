import { IsInt, IsOptional, IsString } from 'class-validator';

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
}

export class AddPowerPrivilegeDto {
  @IsString()
  powerName: string;
}

export class AddMediaPrivilegeDto {
  @IsOptional()
  @IsString()
  swf?: string;

  @IsOptional()
  @IsString()
  swftime?: string;
}
