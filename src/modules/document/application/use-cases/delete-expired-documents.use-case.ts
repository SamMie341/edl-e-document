import { Inject, Injectable, Logger } from '@nestjs/common';
import * as documentRepositoryInterface from '../../domain/repositories/document.repository.interface';
import * as fileStorageInterface from 'src/core/interfaces/file-storage.interface';

@Injectable()
export class DeleteExpiredDocumentsUseCase {
  private readonly logger = new Logger(DeleteExpiredDocumentsUseCase.name);

  constructor(
    @Inject(documentRepositoryInterface.DOCUMENT_REPOSITORY)
    private readonly documentRepository: documentRepositoryInterface.IDocumentRepository,
    @Inject(fileStorageInterface.FILE_STORAGE_SERVICE)
    private readonly fileStorageService: fileStorageInterface.IFileStorageService,
  ) { }

  async execute(approvalFile: Express.Multer.File): Promise<{ deleted: number; message: string }> {
    // 1. Upload/Save the approval file
    const savedFile = await this.fileStorageService.uploadAndCompress({
      buffer: approvalFile.buffer,
      originalname: approvalFile.originalname,
      mimetype: approvalFile.mimetype,
      size: approvalFile.size,
    });

    // 2. Perform destruction with the approval file path
    const deleted = await this.documentRepository.deleteExpired(savedFile.filePath);
    const message =
      deleted > 0
        ? `ລົບເອກະສານທີ່ຫົມດອາຍຸສຳເລັດ: ${deleted} ລາຍການ`
        : 'ບໍ່ມີເອກະສານທີ່ຫົມດອາຍຸ';
    this.logger.log(message);
    return { deleted, message };
  }
}
