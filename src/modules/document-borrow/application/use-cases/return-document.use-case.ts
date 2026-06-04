import { Inject, Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import * as documentBorrowRepositoryInterface from '../../domain/repositories/document-borrow.repository.interface';
import { DocumentBorrowEntity } from '../../domain/entities/document-borrow.entity';

@Injectable()
export class ReturnDocumentUseCase {
  constructor(
    @Inject(documentBorrowRepositoryInterface.DOCUMENT_BORROW_REPOSITORY)
    private readonly borrowRepository: documentBorrowRepositoryInterface.IDocumentBorrowRepository,
  ) { }

  async execute(id: string): Promise<DocumentBorrowEntity> {
    const record = await this.borrowRepository.findById(id);
    if (!record) {
      throw new NotFoundException('ບໍ່ພົບລາຍການຢືມນີ້');
    }
    if (record.isReturned) {
      throw new BadRequestException('ເອກະສານຖືກຄືນແລ້ວ');
    }
    return await this.borrowRepository.return(id, new Date());
  }
}
