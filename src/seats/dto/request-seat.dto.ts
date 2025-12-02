import { IsNumber, IsOptional } from 'class-validator';

export class RequestSeatDto {
  @IsOptional()
  @IsNumber()
  seatIndex?: number;
}
