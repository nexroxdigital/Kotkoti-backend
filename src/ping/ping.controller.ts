import { Controller, Get } from '@nestjs/common';
import { PingService } from './ping.service';

@Controller('ping')
export class PingController {
  constructor(private readonly pingService: PingService) {}

  @Get('server')
  ping() {
    return this.pingService.ping();
  }

  @Get('db')
  async checkDb() {
    return this.pingService.checkDb();
  }
}
