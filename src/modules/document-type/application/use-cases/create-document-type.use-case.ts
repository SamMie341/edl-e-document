import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import * as repoInterface from '../../domain/repositories/document-type.repository.interface';
import { DocumentType } from '../../domain/entities/document-type.entity';
import { CreateDocumentTypeDto } from '../dtos/create-document-type.dto';
import { AuditService } from 'src/modules/audit/application/services/audit.service';
import { AuditAction } from 'src/core/constants/audit-action.enum';

@Injectable()
export class CreateDocumentTypeUseCase {
  constructor(
    @Inject(repoInterface.DOCUMENT_TYPE_REPOSITORY)
    private readonly documentTypeRepository: repoInterface.IDocumentTypeRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(dto: CreateDocumentTypeDto, user?: any): Promise<DocumentType> {
    const created = await this.documentTypeRepository.create(dto);
    await this.auditService.log({
      action: AuditAction.CREATED,
      details: `ສ້າງປະເພດເອກະສານ: ${created.name}`,
      entityId: created.id,
      entityType: 'DOCUMENT_TYPE',
      actorId: user?.userId || user?.id,
      departmentId: user?.departmentId,
      divisionId: user?.divisionId,
    });
    return created;
  }
}
