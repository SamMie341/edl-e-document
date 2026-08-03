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

  async execute(dto: CreateBorrowDto, actorId: string): Promise<DocumentBorrowEntity[]> {
    const items: documentBorrowRepositoryInterface.CreateDocumentBorrowData[] = [];
    const parsedDueDate = dto.dueDate ? new Date(dto.dueDate) : undefined;

    if (dto.documentIds && dto.documentIds.length > 0) {
      for (const docId of dto.documentIds) {
        items.push({
          documentId: docId,
          borrower: dto.borrower,
          phone: dto.phone,
          purpose: dto.purpose,
          toDivisionId: dto.toDivisionId,
          toLocation: dto.toLocation,
          createdById: actorId,
          note: dto.note,
          dueDate: parsedDueDate,
        });
      }
    }

    if (dto.folderIds && dto.folderIds.length > 0) {
      for (const fId of dto.folderIds) {
        items.push({
          folderId: fId,
          borrower: dto.borrower,
          phone: dto.phone,
          purpose: dto.purpose,
          toDivisionId: dto.toDivisionId,
          toLocation: dto.toLocation,
          createdById: actorId,
          note: dto.note,
          dueDate: parsedDueDate,
        });
      }
    }

    if (items.length === 0) {
      throw new BadRequestException('ກະລຸນາເລືອກເອກະສານ ຫຼື ແຟ້ມ ທີ່ຕ້ອງການຢືມ');
    }

    const createdBorrows = await this.borrowRepository.createMany(items);

    for (const b of createdBorrows) {
      await this.auditService.log({
        action: AuditAction.SUBMITTED,
        details: `ຢືມເອກະສານ/ແຟ້ມ ໂດຍ: ${b.borrower}`,
        entityId: b.id,
        entityType: 'DOCUMENT_BORROW',
        actorId,
        divisionId: b.toDivisionId,
        payload: b,
      });
    }

    return createdBorrows;
  }
}
