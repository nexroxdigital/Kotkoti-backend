import { IsEmail } from 'class-validator';

export class RegisterEmailDto {
  @IsEmail()
  email: string;
}
