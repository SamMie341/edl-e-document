import { Inject, Injectable } from "@nestjs/common";
import * as folderRepositoryInterface from "../../domain/repositories/folder.repository.interface";
import { CreateFolderDto } from "../dtos/create-folder.use-case";
import { Folder } from "../../domain/entities/folder.entity";
import { v4 as uuidv4 } from 'uuid';
import * as auditLogRepositoryInterface from "src/modules/audit/domain/repositories/audit-log.repository.interface";
import { AuditLog } from "src/modules/audit/domain/entities/audit-log.entity";
import { AuditAction } from "src/core/constants/audit-action.enum";

@Injectable()
export class CreateFolderUseCase {
    constructor(
        @Inject(folderRepositoryInterface.FOLDER_REPOSITORY)
        private readonly folderRepositoy: folderRepositoryInterface.IFolderRepository,
        @Inject(auditLogRepositoryInterface.AUDIT_LOG_REPOSITORY)
        private readonly auditLogRepository: auditLogRepositoryInterface.IAuditLogRepository
    ) { }

    async execute(dto: CreateFolderDto): Promise<Folder> {
        const now = new Date();

        const newFolder = new Folder(
            uuidv4(),
            dto.name,
            dto.description || null,
            now,
            now,
        );

        await this.folderRepositoy.save(newFolder);

        const log = new AuditLog(
            uuidv4(),
            AuditAction.CREATED,
            ``,
            newFolder.id,
            'FOLDER',
            '',
            new Date(),
        );

        await this.auditLogRepository.save(log);

        return newFolder;
    }
}