import { BadRequestException, Injectable } from '@nestjs/common';
import {
  IFileStorageService,
  SavedFileData,
  UploadedFile,
} from '../interfaces/file-storage.interface';
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LocalFileStorageService implements IFileStorageService {
  private readonly uploadDir: string;

  constructor() {
    this.uploadDir = process.env.UPLOAD_DESTINATION ?? './uploads/documents';

    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadAndCompress(file: UploadedFile): Promise<SavedFileData> {
    if (!file.buffer || file.buffer.length === 0) {
      throw new BadRequestException(`ໄຟລ໌ "${file.originalname}" ບໍ່ມີໄຟລ໌ ຫຼື ໄຟລ໌ສູນຫາຍ`);
    }
    const fileId = uuidv4();
    const isImage = file.mimetype.startsWith('image/');

    let finalFileName = '';
    let finalBuffer: Buffer;
    let finalMimeType = file.mimetype;

    if (isImage) {
      finalFileName = `${fileId}.webp`;
      finalMimeType = 'image/webp';
      finalBuffer = await sharp(file.buffer)
        .resize({ width: 1920, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();
    } else {
      const extension = path.extname(file.originalname);
      finalFileName = `${fileId}${extension}`;
      finalBuffer = file.buffer;
    }

    const filePath = path.join(this.uploadDir, finalFileName);
    fs.writeFileSync(filePath, finalBuffer);

    return {
      fileName: file.originalname,
      filePath: filePath,
      mimeType: finalMimeType,
      size: finalBuffer.length,
    };
  }
}
