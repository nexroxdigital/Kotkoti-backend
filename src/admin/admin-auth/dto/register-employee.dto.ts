import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsStrongPassword,
} from 'class-validator';

import { EmployeeRole } from '@prisma/client';

/**
 * Create Employee DTO
 */
export class CreateEmployeeDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsStrongPassword()
  password: string;

  @IsOptional()
  @IsString()
  profilePicture?: string;

  @IsOptional()
  @IsEnum(EmployeeRole)
  role?: EmployeeRole;
}

/**
 * Update Employee DTO
 */
export class UpdateEmployeeDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsPhoneNumber()
  phone?: string;

  @IsOptional()
  @IsString()
  profilePicture?: string;

  @IsOptional()
  @IsEnum(EmployeeRole)
  role?: EmployeeRole;
}

/**
 * Change Employee Password DTO
 */
export class ChangeEmployeePasswordDto {
  @IsString()
  currentPassword: string;

  @IsStrongPassword()
  newPassword: string;
}
