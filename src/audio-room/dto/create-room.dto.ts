import { IsString, IsOptional, IsEnum } from 'class-validator';
import { Provider } from '@prisma/client';

export class CreateRoomDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(Provider)
  provider?: Provider;
}
