export class CreateLevelGiftDto {
  name: string;
  categoryId: number;
  expiredDate?: Date;
  image: string;
  swf: string;
  swfTime?: string;
  isCharm?: boolean;
  isWealth?: boolean;
  levelNo?: number;
}

export class UpdateLevelGiftDto {
  name?: string;
  categoryId?: number;
  expiredDate?: Date;
  image?: string;
  swf?: string;
  swfTime?: string;
  isCharm?: boolean;
  isWealth?: boolean;
  levelNo?: number;
}
