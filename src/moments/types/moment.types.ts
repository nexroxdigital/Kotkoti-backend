import { CreateMomentDto } from '../dto/moment.dto';

export interface MomentCreateInput extends CreateMomentDto {
  userId: string;
}
