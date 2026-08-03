import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { AppException } from 'src/core/exceptions/app.exception';
import * as repoInterface from '../../domain/repositories/document-type.repository.interface';
import { DocumentType } from '../../domain/entities/document-type.entity';
import { UpdateDocumentTypeDto } from '../dtos/update-document-type.dto';
import { AuditService } from 'src/modules/audit/application/services/audit.service';
import { AuditAction } from 'src/core/constants/audit-action.enum';

@Injectable()
export class UpdateDocumentTypeUseCase {
  constructor(
    @Inject(repoInterface.DOCUMENT_TYPE_REPOSITORY)
    private readonly documentTypeRepository: repoInterface.IDocumentTypeRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(id: string, dto: UpdateDocumentTypeDto, user?: any): Promise<DocumentType> {
    const documentType = await this.documentTypeRepository.findById(id);
    if (!documentType) {
      throw new AppException(
        'DOCUMENT_TYPE_NOT_FOUND',
        `ບໍ່ພົບປະເພດເອກະສານ`,
        {},
        HttpStatus.NOT_FOUND,
      );
    }

    // ກວດສອບຊື່ຊ້ຳ ຖ້າມີການປ່ຽນຊື່
    if (dto.name && dto.name !== documentType.name) {
      const existing = await this.documentTypeRepository.findByName(dto.name);
      if (existing) {
        throw new AppException(
          'DOCUMENT_TYPE_ALREADY_EXISTS',
          `ປະເພດເອກະສານ "${dto.name}" ມີຢູ່ແລ້ວ`,
          {},
          HttpStatus.CONFLICT,
        );
      }
    }

    const updated = await this.documentTypeRepository.update(id, dto);

    await this.auditService.log({
      action: 'UPDATED',
      details: `ແກ້ໄຂປະເພດເອກະສານ: ${documentType.name}`,
      entityId: id,
      entityType: 'DOCUMENT_TYPE',
      actorId: user?.userId || user?.id,
      departmentId: user?.departmentId,
      divisionId: user?.divisionId,
      oldValue: documentType,
      newValue: updated,
    });

    return updated;
  }
}
