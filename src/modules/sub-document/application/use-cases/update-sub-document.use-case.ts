import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { UpdateSubDocumentDto } from '../dtos/update-sub-document.dto';
import { SubDocumentEntity } from '../../domain/entities/sub-document.entity';
import type { ISubDocumentRepository } from '../../domain/repositories/sub-document.repository.interface';
import { SUB_DOCUMENT_REPOSITORY } from '../../domain/repositories/sub-document.repository.interface';
import { AuditService } from 'src/modules/audit/application/services/audit.service';
import { AuditAction } from 'src/core/constants/audit-action.enum';

@Injectable()
export class UpdateSubDocumentUseCase {
  constructor(
    @Inject(SUB_DOCUMENT_REPOSITORY)
    private readonly subDocumentRepository: ISubDocumentRepository,
    private readonly auditService: AuditService,
  ) { }

  async execute(id: string, dto: UpdateSubDocumentDto, user?: any): Promise<SubDocumentEntity> {
    const existing = await this.subDocumentRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`ບໍ່ພົບເອກະສານຍ່ອຍ ID: ${id}`);
    }

    const updated = await this.subDocumentRepository.update(id, dto);

    await this.auditService.log({
      action: 'UPDATED',
      details: `ແກ້ໄຂເອກະສານຍ່ອຍ: ${existing.subDocNo}`,
      entityId: id,
      entityType: 'SUB_DOCUMENT',
      actorId: user?.userId || user?.id,
      departmentId: user?.departmentId,
      divisionId: user?.divisionId,
      oldValue: existing,
      newValue: updated,
    });

    return updated;
  }
}
