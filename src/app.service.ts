import { Injectable } from '@nestjs/common';
import * as os from 'os';

@Injectable()
export class AppService {
  
  getHello() {
    console.log('JWT_SECRET:', process.env.JWT_SECRET);

    return {
      success: true,
      message: 'Kotkoti Server is running',
      version: '1.0.0',
      documentation: 'http://localhost:8000/api',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      host: os.hostname(),
    };
  }
}
