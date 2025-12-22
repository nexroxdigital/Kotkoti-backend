import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import * as fs from 'fs';

@Injectable()
export class FileCleanupInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      catchError((err) => {
        const request = context.switchToHttp().getRequest();

        // Handle single file (FileInterceptor)
        if (request.file && request.file.path) {
          this.deleteFile(request.file.path);
        }

        // Handle multiple files (FilesInterceptor or FileFieldsInterceptor)
        if (request.files) {
          if (Array.isArray(request.files)) {
            // FilesInterceptor
            request.files.forEach((file: Express.Multer.File) =>
              this.deleteFile(file.path),
            );
          } else {
            // FileFieldsInterceptor
            Object.keys(request.files).forEach((key) => {
              const files = request.files[key] as Express.Multer.File[];
              files.forEach((file) => this.deleteFile(file.path));
            });
          }
        }

        return throwError(() => err);
      }),
    );
  }

  private deleteFile(path: string | undefined) {
    if (path && fs.existsSync(path)) {
      try {
        fs.unlinkSync(path);
      } catch (e) {
        // Just log it, don't crash
        console.error(
          `[FileCleanupInterceptor] Failed to delete file at ${path}`,
          e,
        );
      }
    }
  }
}
