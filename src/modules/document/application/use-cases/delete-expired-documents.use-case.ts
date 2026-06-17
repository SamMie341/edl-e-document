import { Inject, Injectable, Logger } from '@nestjs/common';
import * as documentRepositoryInterface from '../../domain/repositories/document.repository.interface';

@Injectable()
export class DeleteExpiredDocumentsUseCase {
  private readonly logger = new Logger(DeleteExpiredDocumentsUseCase.name);

  constructor(
    @Inject(documentRepositoryInterface.DOCUMENT_REPOSITORY)
    private readonly documentRepository: documentRepositoryInterface.IDocumentRepository,
  ) { }

  async execute(): Promise<{ deleted: number; message: string }> {
    const deleted = await this.documentRepository.deleteExpired();
    const message =
      deleted > 0
        ? `ລົບເອກະສານທີ່ຫົມດອາຍຸສຳເລັດ: ${deleted} ລາຍການ`
        : 'ບໍ່ມີເອກະສານທີ່ຫົມດອາຍຸ';
    this.logger.log(message);
    return { deleted, message };
  }
}
