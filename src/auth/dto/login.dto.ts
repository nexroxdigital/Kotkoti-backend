import { IsEmail, IsOptional, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  phone?: string;

  @IsNotEmpty()
  password: string;
}
