import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class ReSellerDto {
  @IsNumber()
  amount: number;

  @IsString()
  @IsNotEmpty()
  receiverId: string; // user who sends coins

  @IsString()
  @IsNotEmpty()
  sellerId: string; // coin seller id
}
