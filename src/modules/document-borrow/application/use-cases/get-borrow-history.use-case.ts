import { Inject, Injectable, NotFoundException } from '@nestjs/common';
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

  // ປະຫວັດຂອງເອກະສານໃດໜຶ່ງ (ກຣອງຕາມ scope ຖ້າມີ)
  async findByDocumentId(
    documentId: string,
    departmentId?: number,
    divisionId?: number,
  ): Promise<DocumentBorrowEntity[]> {
    return await this.borrowRepository.findByDocumentId(documentId, departmentId, divisionId);
  }

  // ປະຫວັດທຸກເອກະສານໃນ folder (ກຣອງຕາມ scope ຖ້າມີ)
  async findByFolderId(
    folderId: string,
    departmentId?: number,
    divisionId?: number,
  ): Promise<DocumentBorrowEntity[]> {
    return await this.borrowRepository.findByFolderId(folderId, departmentId, divisionId);
  }

  // ລາຍການທີ່ຍັງຢືມຢູ່ (ກຣອງຕາມ scope ຖ້າມີ)
  async findActive(departmentId?: number, divisionId?: number): Promise<DocumentBorrowEntity[]> {
    return await this.borrowRepository.findActive(departmentId, divisionId);
  }

  // ດຶງລາຍການຢືມດ້ວຍ ID
  async findById(id: string): Promise<DocumentBorrowEntity> {
    const record = await this.borrowRepository.findById(id);
    if (!record) throw new NotFoundException('ບໍ່ພົບລາຍການຢືມນີ້');
    return record;
  }

  // ປະຫວັດຕາມ division ທີ່ຮັບໄປ (toDivisionId)
  async findByDivisionId(
    divisionId: number,
    activeOnly = false,
  ): Promise<DocumentBorrowEntity[]> {
    return await this.borrowRepository.findByDivisionId(divisionId, activeOnly);
  }
}
