import { Inject, Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import * as documentBorrowRepositoryInterface from '../../domain/repositories/document-borrow.repository.interface';
import { DocumentBorrowEntity } from '../../domain/entities/document-borrow.entity';
import { AuditService } from 'src/modules/audit/application/services/audit.service';
import { AuditAction } from 'src/core/constants/audit-action.enum';

@Injectable()
export class ReturnDocumentUseCase {
  constructor(
    @Inject(documentBorrowRepositoryInterface.DOCUMENT_BORROW_REPOSITORY)
    private readonly borrowRepository: documentBorrowRepositoryInterface.IDocumentBorrowRepository,
    private readonly auditService: AuditService,
  ) { }

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
}
