import { IsArray, IsInt, IsOptional, IsString } from "class-validator";

export class UpdateRoomDto {
  @IsOptional()
  @IsString()
  name?: string;
  announcement?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tag?: string;

  @IsOptional()
  //@IsInt()
  seatCount?: number;
}
