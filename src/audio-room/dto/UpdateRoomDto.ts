import { IsArray, IsInt, IsOptional, IsString } from "class-validator";

export class UpdateRoomDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsInt()
  seatCount?: number;
}
