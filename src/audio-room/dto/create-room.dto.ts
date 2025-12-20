import { IsString, IsNumber, Min, IsOptional, IsArray } from "class-validator";

export class CreateRoomDto {
  @IsString()
  name: string;

  @IsOptional()
  //@IsArray()
  tag?: string;
  announcement?: string;
  @IsString()
  //@Min(1)
  seatCount: number;
}
