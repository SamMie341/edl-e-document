import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import * as documentBorrowRepositoryInterface from '../../domain/repositories/document-borrow.repository.interface';
import { CreateBorrowDto } from '../dtos/create-borrow.dto';
import { DocumentBorrowEntity } from '../../domain/entities/document-borrow.entity';
import { AuditService } from 'src/modules/audit/application/services/audit.service';
import { AuditAction } from 'src/core/constants/audit-action.enum';

@Injectable()
export class BorrowDocumentUseCase {
  constructor(
    @Inject(documentBorrowRepositoryInterface.DOCUMENT_BORROW_REPOSITORY)
    private readonly borrowRepository: documentBorrowRepositoryInterface.IDocumentBorrowRepository,
    private readonly auditService: AuditService,
  ) { }

  async execute(dto: CreateBorrowDto, actorId: string): Promise<DocumentBorrowEntity> {
    const itemDataList: documentBorrowRepositoryInterface.CreateDocumentBorrowItemData[] = [];
    const parsedDueDate = dto.dueDate ? new Date(dto.dueDate) : undefined;

    if (dto.documentIds && dto.documentIds.length > 0) {
      for (const docId of dto.documentIds) {
        itemDataList.push({
          documentId: docId,
          dueDate: parsedDueDate,
          note: dto.note,
        });
      }
    }

    if (dto.folderIds && dto.folderIds.length > 0) {
      for (const fId of dto.folderIds) {
        itemDataList.push({
          folderId: fId,
          dueDate: parsedDueDate,
          note: dto.note,
        });
      }
    }

    if (itemDataList.length === 0) {
      throw new BadRequestException('ກະລຸນາເລືອກເອກະສານ ຫຼື ແຟ້ມ ທີ່ຕ້ອງການຢືມ');
    }

    const createdBorrow = await this.borrowRepository.create({
      borrower: dto.borrower,
      phone: dto.phone,
      purpose: dto.purpose,
      toDivisionId: dto.toDivisionId,
      toLocation: dto.toLocation,
      createdById: actorId,
      note: dto.note,
      items: itemDataList,
    });

    await this.auditService.log({
      action: AuditAction.SUBMITTED,
      details: `ຢືມເອກະສານ/ແຟ້ມ (รวม ${createdBorrow.items.length} รายการ) ໂດຍ: ${createdBorrow.borrower}`,
      entityId: createdBorrow.id,
      entityType: 'DOCUMENT_BORROW',
      actorId,
      divisionId: createdBorrow.toDivisionId,
      payload: createdBorrow,
    });

    return createdBorrow;
  }
}
