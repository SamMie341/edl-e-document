import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { ISubDocumentRepository } from '../../domain/repositories/sub-document.repository.interface';
import { SUB_DOCUMENT_REPOSITORY } from '../../domain/repositories/sub-document.repository.interface';
import { AuditService } from 'src/modules/audit/application/services/audit.service';
import { AuditAction } from 'src/core/constants/audit-action.enum';

@Injectable()
export class DeleteSubDocumentUseCase {
  constructor(
    @Inject(SUB_DOCUMENT_REPOSITORY)
    private readonly subDocumentRepository: ISubDocumentRepository,
    private readonly auditService: AuditService,
  ) { }

  async execute(id: string, user?: any): Promise<{ message: string }> {
    const existing = await this.subDocumentRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`ບໍ່ພົບເອກະສານຍ່ອຍ ID: ${id}`);
    }

    await this.subDocumentRepository.delete(id);

    await this.auditService.log({
      action: AuditAction.DELETED,
      details: `ລຶບເອກະສານຍ່ອຍ: ${existing.subDocNo}`,
      entityId: id,
      entityType: 'SUB_DOCUMENT',
      actorId: user?.userId || user?.id,
      departmentId: user?.departmentId,
      divisionId: user?.divisionId,
      oldValue: existing,
    });

    return { message: 'ລຶບເອກະສານຍ່ອຍສຳເລັດ' };
  }
}
