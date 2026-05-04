import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import * as documentRepositoryInterface from "../../domain/repositories/document.repository.interface";
import { AuditLog } from "src/modules/audit/domain/entities/audit-log.entity";
import * as auditLogRepositoryInterface from "src/modules/audit/domain/repositories/audit-log.repository.interface";
import { v4 as uuidv4 } from 'uuid';
import { AuditAction } from "src/core/constants/audit-action.enum";
import { AppException } from "src/core/exceptions/app.exception";

@Injectable()
export class SubmitDocumentUseCase {
    constructor(
        @Inject(documentRepositoryInterface.DOCUMENT_REPOSITORY)
        private readonly documentRepository: documentRepositoryInterface.IDocumentRepository,
        @Inject(auditLogRepositoryInterface.AUDIT_LOG_REPOSITORY)
        private readonly auditLogRepository: auditLogRepositoryInterface.IAuditLogRepository,
    ) { }

    async execute(documentId: string, userId: string): Promise<void> {
        const document = await this.documentRepository.findById(documentId);

        if (!document) {
            throw new AppException('NOT_FOUND', 'ບໍ່ພົບເອກະສານໃນລະບົບ...', { document }, HttpStatus.NOT_FOUND);
        }

        if (document.userId !== userId) {
            throw new AppException('FORBIDDEN', 'ທ່ານບໍ່ມີສິດສົ່ງເອກະສານທີ່ທ່ານບໍ່ໄດ້ສ້າງ...', '', HttpStatus.FORBIDDEN);
        }
        document.submitForApproval();

        await this.documentRepository.save(document);

        const log = new AuditLog(
            uuidv4(),
            AuditAction.SUBMITTED,
            `SUBMITTED BY ${userId}`,
            document.id,
            'DOCUMENT',
            userId,
            new Date(),
        );

        await this.auditLogRepository.save(log);
    }
}