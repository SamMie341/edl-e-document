import { Module } from '@nestjs/common';
import { DocumentController } from './presentation/controllers/document.controller';
import { CreateDocumentUseCase } from './application/use-cases/create-document.use-case';
import { DOCUMENT_REPOSITORY } from './domain/repositories/document.repository.interface';
import { PrismaDocumentRepository } from './infrastructure/repositories/prisma-document.repository';
import { UploadAttachmentUseCase } from './application/use-cases/upload-attachment.use-case';
import { GetAttachmentUseCase } from './application/use-cases/get-attachment.use-case';
import { AuditModule } from '../audit/audit.module';
import { GetAllDocumentUseCase } from './application/use-cases/get-all-document.use-case';
import { GetDocumentByIdUseCase } from './application/use-cases/get-document-by-id.use-case';
import { UpdateDocumentUseCase } from './application/use-cases/update-document.use-case';
import { DeleteExpiredDocumentsUseCase } from './application/use-cases/delete-expired-documents.use-case';
import { GetExpiredDocumentsUseCase } from './application/use-cases/get-expired-documents.use-case';
import { DeleteDocumentUseCase } from './application/use-cases/delete-document.use-case';
import { FolderModule } from '../folder/folder.module';

@Module({
  imports: [AuditModule, FolderModule],
  controllers: [DocumentController],
  providers: [
    // ── Document use cases ─────────────────────────────────────────────────
    CreateDocumentUseCase,
    UploadAttachmentUseCase,
    GetAttachmentUseCase,
    GetAllDocumentUseCase,
    GetDocumentByIdUseCase,
    UpdateDocumentUseCase,
    DeleteExpiredDocumentsUseCase,
    GetExpiredDocumentsUseCase,
    DeleteDocumentUseCase,

    // ── Repository ─────────────────────────────────────────────────────────
    {
      provide: DOCUMENT_REPOSITORY,
      useClass: PrismaDocumentRepository,
    },
  ],
})
export class DocumentModule { }
