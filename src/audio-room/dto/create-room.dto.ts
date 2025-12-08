import { IsString, IsNumber, Min, IsOptional, IsArray } from "class-validator";

export class CreateRoomDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsArray()
  tags?: string[];

  @IsString()
  //@Min(1)
  seatCount: number;
}
