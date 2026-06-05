import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { AppException } from 'src/core/exceptions/app.exception';
import * as repoInterface from '../../domain/repositories/document-type.repository.interface';
import * as auditLogRepositoryInterface from 'src/modules/audit/domain/repositories/audit-log.repository.interface';
import { AuditLog } from 'src/modules/audit/domain/entities/audit-log.entity';
import { v4 as uuidv4 } from 'uuid';
import { AuditAction } from 'src/core/constants/audit-action.enum';

@Injectable()
export class DeleteDocumentTypeUseCase {
  constructor(
    @Inject(repoInterface.DOCUMENT_TYPE_REPOSITORY)
    private readonly documentTypeRepository: repoInterface.IDocumentTypeRepository,
    @Inject(auditLogRepositoryInterface.AUDIT_LOG_REPOSITORY)
    private readonly auditLogRepository: auditLogRepositoryInterface.IAuditLogRepository,
  ) {}

  async execute(id: string): Promise<void> {
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

    const log = new AuditLog(
      uuidv4(),
      AuditAction.DELETED,
      'ລຶບປະເພດເອກະສານ',
      documentType.id,
      'DOCUMENT_TYPE',
      '',
      new Date(),
    );

    await this.auditLogRepository.save(log);
  }
}
