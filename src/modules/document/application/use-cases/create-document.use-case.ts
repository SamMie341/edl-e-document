import * as auditLogRepositoryInterface from './../../../audit/domain/repositories/audit-log.repository.interface';
import { Injectable, Inject, HttpStatus } from '@nestjs/common';
import { CreateDocumentDto } from '../dtos/create-document.dto';
import { Document } from '../../domain/entities/document.entity';
import { DocumentStatus } from '../../domain/value-objects/document-status.enum';
import * as documentRepositoryInterface from '../../domain/repositories/document.repository.interface';
import { v4 as uuidv4 } from 'uuid';
import { AuditLog } from 'src/modules/audit/domain/entities/audit-log.entity';
import { AuditAction } from 'src/core/constants/audit-action.enum';
import * as folderRepositoryInterface from 'src/modules/folder/domain/repositories/folder.repository.interface';
import { AppException } from 'src/core/exceptions/app.exception';

@Injectable()
export class CreateDocumentUseCase {
    constructor(
        @Inject(documentRepositoryInterface.DOCUMENT_REPOSITORY)
        private readonly documentRepository: documentRepositoryInterface.IDocumentRepository,
        @Inject(auditLogRepositoryInterface.AUDIT_LOG_REPOSITORY)
        private readonly auditLogRepository: auditLogRepositoryInterface.IAuditLogRepository,
        @Inject(folderRepositoryInterface.FOLDER_REPOSITORY)
        private readonly folderRepository: folderRepositoryInterface.IFolderRepository,
    ) { }

    async execute(dto: CreateDocumentDto): Promise<Document> {
        if (dto.folderId) {
            const folder = await this.folderRepository.findById(dto.folderId);

            if (!folder) {
                throw new AppException(
                    'GOLONO_NOT_FOUND',
                    'ບໍ່ພົບໂກໂລໂນເອກະສານທີ່ລະບຸ',
                    folder,
                    HttpStatus.NOT_FOUND,
                );
            }

            if (folder.branchId !== dto.branchId) {
                throw new AppException(
                    'FORBIDDEN',
                    'ທ່ານບໍ່ມີສິດນຳເອກະສານໄປໃສ່ໃນໂກໂລໂນສາຂາອື່ນ',
                    '',
                    HttpStatus.FORBIDDEN,
                );
            }
        }

        const documentId = uuidv4();
        const now = new Date();
        const newDocument = new Document(
            documentId,
            dto.title,
            dto.content,
            DocumentStatus.DRAFT,
            dto.creatorId,
            dto.branchId,
            dto.folderId || '',
            now,
            now,
        );

        await this.documentRepository.save(newDocument);

        const log = new AuditLog(
            uuidv4(),
            AuditAction.CREATED,
            'ສ້າງເອກະສານສະບັບຮ່າງ',
            newDocument.id,
            'DOCUMENT',
            dto.creatorId,
            new Date(),
        );

        await this.auditLogRepository.save(log);

        return newDocument;
    }
}