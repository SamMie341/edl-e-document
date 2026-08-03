import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { CreateSubDocumentsDto } from '../dtos/create-sub-document.dto';
import { SubDocumentEntity } from '../../domain/entities/sub-document.entity';
import type { ISubDocumentRepository } from '../../domain/repositories/sub-document.repository.interface';
import { SUB_DOCUMENT_REPOSITORY } from '../../domain/repositories/sub-document.repository.interface';
import { PrismaService } from 'src/core/database/prisma.service';
import { AuditService } from 'src/modules/audit/application/services/audit.service';
import { AuditAction } from 'src/core/constants/audit-action.enum';

@Injectable()
export class CreateSubDocumentUseCase {
  constructor(
    @Inject(SUB_DOCUMENT_REPOSITORY)
    private readonly subDocumentRepository: ISubDocumentRepository,
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) { }

  async execute(documentId: string, dto: CreateSubDocumentsDto, user?: any): Promise<SubDocumentEntity[]> {
    // ── ຕຳວ່າ Document ມີຢູ່ຈິງ ──────────────────────────────────────────────
    const doc = await this.prisma.documentModel.findUnique({ where: { id: documentId } });
    if (!doc) {
      throw new NotFoundException(`ບໍ່ພົບເອກະສານ ID: ${documentId}`);
    }

    const created = await this.subDocumentRepository.createMany(documentId, dto.subDocuments);

    for (const subDoc of created) {
      await this.auditService.log({
        action: AuditAction.CREATED,
        details: `ສ້າງເອກະສານຍ່ອຍ เลขที่: ${subDoc.subDocNo}`,
        entityId: subDoc.id,
        entityType: 'SUB_DOCUMENT',
        actorId: user?.userId || user?.id,
        departmentId: user?.departmentId,
        divisionId: user?.divisionId,
      });
    }

    return created;
  }
}
