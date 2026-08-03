import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { AppException } from 'src/core/exceptions/app.exception';
import * as repoInterface from '../../domain/repositories/document-type.repository.interface';
import { AuditService } from 'src/modules/audit/application/services/audit.service';
import { AuditAction } from 'src/core/constants/audit-action.enum';

@Injectable()
export class DeleteDocumentTypeUseCase {
  constructor(
    @Inject(repoInterface.DOCUMENT_TYPE_REPOSITORY)
    private readonly documentTypeRepository: repoInterface.IDocumentTypeRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(id: string, user?: any): Promise<void> {
    const documentType = await this.documentTypeRepository.findById(id);
    if (!documentType) {
      throw new AppException(
        'DOCUMENT_TYPE_NOT_FOUND',
        `ບໍ່ພົບປະເພດເອກະສານ`,
        {},
        HttpStatus.NOT_FOUND,
      );
    }

    await this.documentTypeRepository.delete(id);

    await this.auditService.log({
      action: AuditAction.DELETED,
      details: `ລຶບປະເພດເອກະສານ: ${documentType.name}`,
      entityId: documentType.id,
      entityType: 'DOCUMENT_TYPE',
      actorId: user?.userId || user?.id,
      departmentId: user?.departmentId,
      divisionId: user?.divisionId,
      oldValue: documentType,
    });
  }
}
