import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import * as documentBorrowRepositoryInterface from '../../domain/repositories/document-borrow.repository.interface';
import { CreateBorrowDto } from '../dtos/create-borrow.dto';
import { DocumentBorrowEntity } from '../../domain/entities/document-borrow.entity';

@Injectable()
export class BorrowDocumentUseCase {
  constructor(
    @Inject(documentBorrowRepositoryInterface.DOCUMENT_BORROW_REPOSITORY)
    private readonly borrowRepository: documentBorrowRepositoryInterface.IDocumentBorrowRepository,
  ) { }

  async execute(dto: CreateBorrowDto, actorId: string): Promise<DocumentBorrowEntity> {
    return await this.borrowRepository.create({
      documentId: dto.documentId,
      folderId: dto.folderId,
      borrowerId: dto.borrowerId,
      purpose: dto.purpose,
      toDivisionId: dto.toDivisionId,
      toLocation: dto.toLocation,
      createdById: actorId,
      note: dto.note,
    });
  }
}
