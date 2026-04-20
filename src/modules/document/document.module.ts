import { Module } from '@nestjs/common';
import { DocumentController } from './presentation/controllers/document.controller';
import { CreateDocumentUseCase } from './application/use-cases/create-document.use-case';
import { DOCUMENT_REPOSITORY } from './domain/repositories/document.repository.interface';
import { PrismaDocumentRepository } from './infrastructure/repositories/prisma-document.repository';
import { ApproveDocumentUseCase } from './application/use-cases/approve-document.use-case';
import { SubmitDocumentUseCase } from './application/use-cases/submit-document.use-case';
import { RejectDocumentUseCase } from './application/use-cases/reject-document.use-case';
import { UploadAttachmentUseCase } from './application/use-cases/upload-attachment.use-case';
import { GetAttachmentUseCase } from './application/use-cases/get-attachment.use-case';
import { AuditModule } from '../audit/audit.module';
import { GetAllDocumentUseCase } from './application/use-cases/get-all-document.use-case';
import { SearchDocumentsUseCase } from './application/use-cases/search-documents.use-case';
import { FolderModule } from '../folder/folder.module';

@Module({
    imports: [
        AuditModule,
        FolderModule,
    ],
    controllers: [DocumentController],
    providers: [
        CreateDocumentUseCase,
        SubmitDocumentUseCase,
        ApproveDocumentUseCase,
        RejectDocumentUseCase,
        UploadAttachmentUseCase,
        GetAttachmentUseCase,
        // GetAllDocumentUseCase,
        SearchDocumentsUseCase,
        {
            provide: DOCUMENT_REPOSITORY,
            useClass: PrismaDocumentRepository,
        }
    ],
})
export class DocumentModule { }