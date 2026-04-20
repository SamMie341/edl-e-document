import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import { AuditAction } from "src/core/constants/audit-action.enum";
import { PrismaService } from "src/core/database/prisma.service";
import { AppException } from "src/core/exceptions/app.exception";
import * as fileStorageInterface from "src/core/interfaces/file-storage.interface";
import { AuditLog } from "src/modules/audit/domain/entities/audit-log.entity";
import * as auditLogRepositoryInterface from "src/modules/audit/domain/repositories/audit-log.repository.interface";
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadAttachmentUseCase {
    constructor(
        @Inject(fileStorageInterface.FILE_STORAGE_SERVICE)
        private readonly fileStorage: fileStorageInterface.IFileStorageService,
        private readonly prisma: PrismaService,
        @Inject(auditLogRepositoryInterface.AUDIT_LOG_REPOSITORY)
        private readonly auditLogRepository: auditLogRepositoryInterface.IAuditLogRepository,
    ) { }

    async execute(documentId: string, file: any, userId: string): Promise<any> {
        const document = await this.prisma.documentModel.findUnique({ where: { id: documentId } });
        if (!document) throw new AppException('NOT_FOUND', 'ບໍ່ພົບເອກະສານ', { documentId }, HttpStatus.NOT_FOUND);
        if (document.creatorId !== userId) throw new AppException('FORBIDDEN', 'ສະເພາະເຈົ້າຂອງເອກະສານເທົ່ານັ້ນທີ່ເພີ່ມໄຟລ໌ໄດ້', '', HttpStatus.FORBIDDEN);

        const savedFile = await this.fileStorage.uploadAndCompress(file);

        const attachment = await this.prisma.attachmentModel.create({
            data: {
                fileName: savedFile.fileName,
                filePath: savedFile.filePath,
                mimeType: savedFile.mimeType,
                size: savedFile.size,
                documentId: document.id,
            }
        });

        const log = new AuditLog(
            uuidv4(),
            AuditAction.UPLOADATTACHMENT,
            `UPLOAD BY ${userId}`,
            document.id,
            'DOCUMENT',
            userId,
            new Date(),
        );

        await this.auditLogRepository.save(log);

        return attachment;
    }
}