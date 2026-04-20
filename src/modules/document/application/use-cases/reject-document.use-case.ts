import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import * as documentRepositoryInterface from "../../domain/repositories/document.repository.interface";
import { RejectDocumentDto } from "../dtos/reject-document.dto";
import { Role } from "src/core/auth/constants/role.enum";
import { AuditLog } from "src/modules/audit/domain/entities/audit-log.entity";
import { v4 as uuidv4 } from 'uuid';
import { AuditAction } from "src/core/constants/audit-action.enum";
import * as auditLogRepositoryInterface from "src/modules/audit/domain/repositories/audit-log.repository.interface";
import { AppException } from "src/core/exceptions/app.exception";

@Injectable()
export class RejectDocumentUseCase {
    constructor(
        @Inject(documentRepositoryInterface.DOCUMENT_REPOSITORY)
        private readonly documentRepository: documentRepositoryInterface.IDocumentRepository,
        @Inject(auditLogRepositoryInterface.AUDIT_LOG_REPOSITORY) private readonly auditLogRepository: auditLogRepositoryInterface.IAuditLogRepository,
    ) { }

    async execute(documentId: string, dto: RejectDocumentDto, user: any): Promise<void> {
        const document = await this.documentRepository.findById(documentId);

        if (!document) throw new AppException('NOT_FOUND', 'ບໍ່ພົບເອກະສານໃນລະບົບ', { documentId }, HttpStatus.NOT_FOUND);

        if (user.role === Role.BRANCH_ADMIN && document.branchId !== user.branchId !== user.branchId) {
            throw new AppException('FORBIDDEN', 'ທ່ານບໍ່ມີສິດປະຕິເສດເອກະສານຂອງສາຂາອື່ນ', '', HttpStatus.FORBIDDEN)
        }

        document.reject();

        await this.documentRepository.save(document);

        const log = new AuditLog(
            uuidv4(),
            AuditAction.REJECTED,
            dto.reason,
            document.id,
            'DOCUMENT',
            user.userId,
            new Date(),
        );
        await this.auditLogRepository.save(log);
    }
}