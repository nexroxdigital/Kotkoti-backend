import { Controller } from '@nestjs/common';
import { SvipService } from './svip.service';

@Controller('svip')
export class SvipController {
  constructor(private readonly svipService: SvipService) {}
}
