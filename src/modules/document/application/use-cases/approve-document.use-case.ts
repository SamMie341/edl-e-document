import { HttpStatus, Inject, Injectable, NotFoundException } from "@nestjs/common";
import * as documentRepositoryInterface from "src/modules/document/domain/repositories/document.repository.interface";
import { Role } from "src/core/auth/constants/role.enum";
import * as auditLogRepositoryInterface from "src/modules/audit/domain/repositories/audit-log.repository.interface";
import { AuditLog } from "src/modules/audit/domain/entities/audit-log.entity";
import { v4 as uuidv4 } from 'uuid';
import { AuditAction } from "src/core/constants/audit-action.enum";
import { AppException } from "src/core/exceptions/app.exception";

@Injectable()
export class ApproveDocumentUseCase {
    constructor(
        @Inject(documentRepositoryInterface.DOCUMENT_REPOSITORY)
        private readonly documentRepository: documentRepositoryInterface.IDocumentRepository,
        @Inject(auditLogRepositoryInterface.AUDIT_LOG_REPOSITORY)
        private readonly auditLogRepository: auditLogRepositoryInterface.IAuditLogRepository
    ) { }

    async execute(documentId: string, user: any): Promise<void> {
        const document = await this.documentRepository.findById(documentId);
        if (!document) throw new NotFoundException('ບໍ່ພົບເອກະສານ');

        if (user.role === Role.BRANCH_ADMIN) {
            if (document.branchId !== user.branchId) {
                throw new AppException(
                    'UNAUTHORIZATION',
                    'ທ່ານບໍ່ມີສິດອະນຸມັດເອກະສານສາຂາອື່ນ',
                    '',
                    HttpStatus.UNAUTHORIZED,
                );
            }
        } else if (user.role === Role.HQ_ADMIN || user.role === Role.SUPER_ADMIN) {

        } else {
            throw new AppException(
                'UNAUTHORIZATION',
                'ທ່ານບໍ່ມີສິດອະນຸມັດເອກະສານ!',
                '',
                HttpStatus.UNAUTHORIZED,
            );
        }

        document.approve();

        await this.documentRepository.save(document);

        const log = new AuditLog(
            uuidv4(),
            AuditAction.APPROVED,
            '',
            document.id,
            'DOCUMENT',
            user.userId,
            new Date(),
        );
        await this.auditLogRepository.save(log);
    }
}