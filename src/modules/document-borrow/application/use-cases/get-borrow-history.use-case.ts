import { Inject, Injectable } from '@nestjs/common';
import * as documentBorrowRepositoryInterface from '../../domain/repositories/document-borrow.repository.interface';
import { DocumentBorrowEntity } from '../../domain/entities/document-borrow.entity';

@Injectable()
export class GetBorrowHistoryUseCase {
  constructor(
    @Inject(documentBorrowRepositoryInterface.DOCUMENT_BORROW_REPOSITORY)
    private readonly borrowRepository: documentBorrowRepositoryInterface.IDocumentBorrowRepository,
  ) { }

  // ປະຫວັດທັງໝົດ (paginated)
  async findAll(params: documentBorrowRepositoryInterface.DocumentBorrowFilterParams): Promise<{ data: DocumentBorrowEntity[]; total: number }> {
    return await this.borrowRepository.findAll(params);
  }

  // ປະຫວັດຂອງເອກະສານໃດໜຶ່ງ
  async findByDocumentId(documentId: string): Promise<DocumentBorrowEntity[]> {
    return await this.borrowRepository.findByDocumentId(documentId);
  }

  // ປະຫວັດທຸກເອກະສານໃນ folder
  async findByFolderId(folderId: string): Promise<DocumentBorrowEntity[]> {
    return await this.borrowRepository.findByFolderId(folderId);
  }

  // ລາຍການທີ່ຍັງຢືມຢູ່ (ຍັງບໍ່ຄືນ)
  async findActive(): Promise<DocumentBorrowEntity[]> {
    return await this.borrowRepository.findActive();
  }
}
