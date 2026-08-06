import { Inject, Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import * as documentBorrowRepositoryInterface from '../../domain/repositories/document-borrow.repository.interface';
import { DocumentBorrowEntity, DocumentBorrowItemEntity } from '../../domain/entities/document-borrow.entity';
import { AuditService } from 'src/modules/audit/application/services/audit.service';

@Injectable()
export class ReturnDocumentUseCase {
  constructor(
    @Inject(documentBorrowRepositoryInterface.DOCUMENT_BORROW_REPOSITORY)
    private readonly borrowRepository: documentBorrowRepositoryInterface.IDocumentBorrowRepository,
    private readonly auditService: AuditService,
  ) { }

  // คืนทั้งใบยืม (ทุกรายการ)
  async execute(id: string, actorId?: string): Promise<DocumentBorrowEntity> {
    const record = await this.borrowRepository.findById(id);
    if (!record) {
      throw new NotFoundException('ບໍ່ພົບລາຍການຢືມນີ້');
    }
    if (record.isReturned) {
      throw new BadRequestException('ເອກະສານຖືກຄືນແລ້ວ');
    }

    const returned = await this.borrowRepository.return(id, new Date());

    await this.auditService.log({
      action: 'RETURNED',
      details: `ສົ່ງຄືນເອກະສານ/ແຟ້ມ ຂອງ: ${record.borrower}`,
      entityId: id,
      entityType: 'DOCUMENT_BORROW',
      actorId,
      divisionId: record.toDivisionId,
      oldValue: record,
      newValue: returned,
    });

    return returned;
  }

  // คืนเฉพาะรายการย่อย (Item)
  async executeItemReturn(itemId: string, actorId?: string): Promise<{ item: DocumentBorrowItemEntity; header: DocumentBorrowEntity }> {
    const item = await this.borrowRepository.findItemById(itemId);
    if (!item) {
      throw new NotFoundException('ບໍ່ພົບລາຍການເອກະສານຢືມນີ້');
    }
    if (item.isReturned) {
      throw new BadRequestException('ເອກະສານນີ້ຖືກຄືນແລ້ວ');
    }

    const result = await this.borrowRepository.returnItem(itemId, new Date());

    await this.auditService.log({
      action: 'RETURNED',
      details: `ສົ່ງຄືນເອກະສານ/ແຟ້ມ (Item ID: ${itemId}) ຂອງ: ${result.header.borrower}`,
      entityId: itemId,
      entityType: 'DOCUMENT_BORROW_ITEM',
      actorId,
      divisionId: result.header.toDivisionId,
      oldValue: item,
      newValue: result.item,
    });

    return result;
  }
}
