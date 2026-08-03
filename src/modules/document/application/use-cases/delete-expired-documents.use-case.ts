import { Inject, Injectable, Logger } from '@nestjs/common';
import * as documentRepositoryInterface from '../../domain/repositories/document.repository.interface';
import * as fileStorageInterface from 'src/core/interfaces/file-storage.interface';
import { CleanupEmptyFoldersUseCase } from 'src/modules/shelf/application/use-cases/cleanup-empty-folders.use-case';

@Injectable()
export class DeleteExpiredDocumentsUseCase {
  private readonly logger = new Logger(DeleteExpiredDocumentsUseCase.name);

  constructor(
    @Inject(documentRepositoryInterface.DOCUMENT_REPOSITORY)
    private readonly documentRepository: documentRepositoryInterface.IDocumentRepository,
    @Inject(fileStorageInterface.FILE_STORAGE_SERVICE)
    private readonly fileStorageService: fileStorageInterface.IFileStorageService,
    private readonly cleanupEmptyFoldersUseCase: CleanupEmptyFoldersUseCase,
  ) { }

  async execute(
    approvalFile: Express.Multer.File,
    dto?: { destroyedDate?: string; details?: string; reason?: string },
    user?: any,
  ): Promise<{ deleted: number; message: string }> {
    // 1. Upload/Save the approval file
    const savedFile = await this.fileStorageService.uploadAndCompress({
      buffer: approvalFile.buffer,
      originalname: approvalFile.originalname,
      mimetype: approvalFile.mimetype,
      size: approvalFile.size,
    });

    // 2. Perform destruction with the approval file path
    const deleted = await this.documentRepository.deleteExpired(savedFile.filePath);

    // 3. Cleanup any folders that now have 0 active documents
    if (deleted > 0) {
      await this.cleanupEmptyFoldersUseCase.execute(undefined, user);
    }

    const destructionDate = dto?.destroyedDate || '';
    const destructionDetails = dto?.details || dto?.reason || '';

    const logInfo = [
      deleted > 0 ? `ລົບເອກະສານທີ່ຫົມດອາຍຸສຳເລັດ: ${deleted} ລາຍການ` : 'ບໍ່ມີເອກະສານທີ່ຫົມດອາຍຸ',
      destructionDate ? `ວັນທີທຳລາຍ: ${destructionDate}` : null,
      destructionDetails ? `ລາຍລະອຽດ: ${destructionDetails}` : null,
      `ໄຟລ໌ອະນຸມັດ: ${savedFile.filePath}`,
    ]
      .filter(Boolean)
      .join(' | ');

    const message =
      deleted > 0
        ? `ລົບເອກະສານທີ່ຫົມດອາຍຸສຳເລັດ: ${deleted} ລາຍການ`
        : 'ບໍ່ມີເອກະສານທີ່ຫົມດອາຍຸ';
    this.logger.log(logInfo);
    return { deleted, message };
  }
}
