import { Injectable } from '@nestjs/common';
import * as os from 'os';

@Injectable()
export class AppService {
  getHello() {
    return {
      success: true,
      message: 'Kotkoti Server is running',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      host: os.hostname(),
    };
  }
}
