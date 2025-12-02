export class CreateGiftDto {
  categoryId: string;
  name: string;
  type: string;
  needCoin: number;
  giftIcon: string;
  swf: string;
  swfTime: string;
  worldMsg: boolean;
  isSound: boolean;
}

export class UpdateGiftDto {
  categoryId?: string;
  name?: string;
  type?: string;
  needCoin?: number;
  giftIcon?: string;
  swf?: string;
  swfTime?: string;
  worldMsg?: boolean;
  isSound?: boolean;
}
