import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CompleteProfileDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsString()
  dob: string;

  @IsString()
  gender: string;

  @IsString()
  country: string;
}
