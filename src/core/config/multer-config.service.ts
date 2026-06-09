import { BadRequestException, Injectable } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { memoryStorage } from 'multer';
import { Request } from 'express';

@Injectable()
export class MulterConfigService {
  private readonly maxFileSize: number;
  private readonly maxFiles: number;
  private readonly allowedMimeTypes: string[];

  constructor() {
    this.maxFileSize = Number(process.env.UPLOAD_MAX_FILE_SIZE ?? 52428800); // default 50MB
    this.maxFiles = Number(process.env.UPLOAD_MAX_FILES ?? 10);
    this.allowedMimeTypes = (
      process.env.UPLOAD_ALLOWED_MIME_TYPES ??
      'image/jpeg,image/png,image/gif,image/webp,application/pdf'
    )
      .split(',')
      .map((t) => t.trim());
  }

  /**
   * Options สำหรับ FilesInterceptor (หลายไฟล์)
   */
  getMultipleFilesOptions(): MulterOptions {
    return {
      storage: memoryStorage(),
      limits: {
        fileSize: this.maxFileSize,
        files: this.maxFiles,
      },
      fileFilter: this.buildFileFilter(),
    };
  }

  /**
   * Options สำหรับ FileInterceptor (ไฟล์เดียว)
   */
  getSingleFileOptions(): MulterOptions {
    return {
      storage: memoryStorage(),
      limits: {
        fileSize: this.maxFileSize,
        files: 1,
      },
      fileFilter: this.buildFileFilter(),
    };
  }

  private buildFileFilter() {
    const allowed = this.allowedMimeTypes;
    return (
      _req: Request,
      file: Express.Multer.File,
      callback: (error: Error | null, acceptFile: boolean) => void,
    ) => {
      if (!allowed.includes(file.mimetype)) {
        return callback(
          new BadRequestException(
            `ປະເພດໄຟລ໌ "${file.mimetype}" ບໍ່ໄດ້ຮັບອະນຸຍາດ. ປະເພດທີ່ອະນຸຍາດ: ${allowed.join(', ')}`,
          ),
          false,
        );
      }
      callback(null, true);
    };
  }
}
