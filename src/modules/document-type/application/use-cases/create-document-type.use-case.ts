import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { AppException } from 'src/core/exceptions/app.exception';
import * as repoInterface from '../../domain/repositories/document-type.repository.interface';
import { DocumentType } from '../../domain/entities/document-type.entity';
import { CreateDocumentTypeDto } from '../dtos/create-document-type.dto';
import * as auditLogRepositoryInterface from 'src/modules/audit/domain/repositories/audit-log.repository.interface';
import { AuditLog } from 'src/modules/audit/domain/entities/audit-log.entity';
import { AuditAction } from 'src/core/constants/audit-action.enum';

@Injectable()
export class CreateDocumentTypeUseCase {
    constructor(
        @Inject(repoInterface.DOCUMENT_TYPE_REPOSITORY)
        private readonly documentTypeRepository: repoInterface.IDocumentTypeRepository,
        @Inject(auditLogRepositoryInterface.AUDIT_LOG_REPOSITORY)
        private readonly auditLogRepository: auditLogRepositoryInterface.IAuditLogRepository,
    ) { }

    async execute(dto: CreateDocumentTypeDto): Promise<DocumentType> {
        const existing = await this.documentTypeRepository.findByName(dto.name);
        if (existing) {
            throw new AppException(
                'DOCUMENT_TYPE_ALREADY_EXISTS',
                `ປະເພດເອກະສານ "${dto.name}" ມີຢູ່ແລ້ວ`,
                {},
                HttpStatus.CONFLICT,
            );
        }

        const now = new Date();
        const newDocumentType = new DocumentType(
            uuidv4(),
            dto.name,
            dto.description ?? null,
            true,
            now,
            now,
        );

        await this.documentTypeRepository.save(newDocumentType);

        const log = new AuditLog(
            uuidv4(),
            AuditAction.CREATED,
            'ເພີ່ມປະເພດເອກະສານ',
            newDocumentType.id,
            'DOCUMENT_TYPE',
            '',
            new Date(),
        );

        await this.auditLogRepository.save(log);

        return newDocumentType;
    }
}
