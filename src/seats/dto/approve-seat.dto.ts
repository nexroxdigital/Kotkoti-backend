import { IsBoolean, IsString } from 'class-validator';

export class ApproveSeatDto {
  @IsString()
  requestId: string;

  @IsBoolean()
  accept: boolean;
}
