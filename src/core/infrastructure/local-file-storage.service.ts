import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import {
  IFileStorageService,
  SavedFileData,
  UploadedFile,
} from '../interfaces/file-storage.interface';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { PDFDocument } from 'pdf-lib';

const MAX_UNCOMPRESSED_SIZE = 100 * 1024 * 1024; // 100MB

@Injectable()
export class LocalFileStorageService implements IFileStorageService {
  private readonly logger = new Logger(LocalFileStorageService.name);
  private readonly uploadDir: string;

  constructor() {
    this.uploadDir = process.env.UPLOAD_DESTINATION ?? './uploads/documents';

    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadAndCompress(file: UploadedFile): Promise<SavedFileData> {
    if (!file.buffer || file.buffer.length === 0) {
      throw new BadRequestException(
        `ໄຟລ໌ "${file.originalname}" ບໍ່ມີໄຟລ໌ ຫຼື ໄຟລ໌ສູນຫາຍ`,
      );
    }
    const fileId = uuidv4();
    const extension = path.extname(file.originalname) || '.pdf';
    const finalFileName = `${fileId}${extension}`;

    let finalBuffer: Buffer = file.buffer;

    // เช็คถ้าขนาดไฟล์เกิน 100MB ให้ทำการบีบอัด PDF
    if (file.buffer.length > MAX_UNCOMPRESSED_SIZE) {
      try {
        this.logger.log(
          `ໄຟລ໌ "${file.originalname}" ມີຂະໜາດໃຫຍ່ກວ່າ 100MB (${(file.buffer.length / (1024 * 1024)).toFixed(2)} MB), ກຳລັງບີບອັດໄຟລ໌...`,
        );
        const pdfDoc = await PDFDocument.load(file.buffer, {
          ignoreEncryption: true,
        });
        const compressedBytes = await pdfDoc.save({ useObjectStreams: true });
        finalBuffer = Buffer.from(compressedBytes);
        this.logger.log(
          `ບີບອັດໄຟລ໌ສຳເລັດ: ຂະໜາດໄຟລ໌ເຫຼືອ ${(finalBuffer.length / (1024 * 1024)).toFixed(2)} MB`,
        );
      } catch (error) {
        this.logger.error(
          `ບໍ່ສາມາດບີບອັດໄຟລ໌ "${file.originalname}" ໄດ້, ຈະໃຊ້ຂະໜາດໄຟລ໌ຕົ້ນສະບັບແທນ`,
          error,
        );
      }
    }

    const filePath = path.join(this.uploadDir, finalFileName);
    fs.writeFileSync(filePath, finalBuffer);

    return {
      fileName: file.originalname,
      filePath: filePath,
      mimeType: file.mimetype || 'application/pdf',
      size: finalBuffer.length,
    };
  }
}
