import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  private readonly logger = new Logger('API Performance');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, ip } = request;
    const userAgent = request.get('user-agent') || '';

    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const endTime = Date.now();
          const responseTime = endTime - startTime;

          // Color code based on performance
          const logLevel = this.getLogLevel(responseTime);
          const emoji = this.getEmoji(responseTime);

          const message = `${emoji} ${method} ${url} - ${responseTime}ms`;

          // Log with appropriate level
          if (logLevel === 'warn') {
            this.logger.warn(message);
          } else if (logLevel === 'error') {
            this.logger.error(message);
          } else {
            this.logger.log(message);
          }

          // Detailed log for slow requests
          if (responseTime > 1000) {
            this.logger.warn(`🐢 SLOW REQUEST DETECTED:
  Method: ${method}
  URL: ${url}
  Response Time: ${responseTime}ms
  IP: ${ip}
  User Agent: ${userAgent}
  Timestamp: ${new Date().toISOString()}
            `);
          }
        },
        error: (error) => {
          const endTime = Date.now();
          const responseTime = endTime - startTime;

          this.logger.error(
            `❌ ${method} ${url} - ${responseTime}ms - ERROR: ${error.message}`,
          );
        },
      }),
    );
  }

  private getLogLevel(responseTime: number): 'log' | 'warn' | 'error' {
    if (responseTime > 2000) return 'error';
    if (responseTime > 500) return 'warn';
    return 'log';
  }

  private getEmoji(responseTime: number): string {
    if (responseTime < 100) return '⚡'; // Excellent
    if (responseTime < 300) return '✅'; // Good
    if (responseTime < 500) return '🟡'; // Acceptable
    if (responseTime < 1000) return '🟠'; // Slow
    if (responseTime < 2000) return '🔴'; // Very Slow
    return '🐢'; // Critical
  }
}
