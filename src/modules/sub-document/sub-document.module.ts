import { Module } from '@nestjs/common';
import { SubDocumentController } from './presentation/controllers/sub-document.controller';
import { CreateSubDocumentUseCase } from './application/use-cases/create-sub-document.use-case';
import { GetSubDocumentsUseCase } from './application/use-cases/get-sub-documents.use-case';
import { UpdateSubDocumentUseCase } from './application/use-cases/update-sub-document.use-case';
import { DeleteSubDocumentUseCase } from './application/use-cases/delete-sub-document.use-case';
import { SUB_DOCUMENT_REPOSITORY } from './domain/repositories/sub-document.repository.interface';
import { PrismaSubDocumentRepository } from './infrastructure/repositories/prisma-sub-document.repository';

@Module({
  controllers: [SubDocumentController],
  providers: [
    // ── Use Cases ─────────────────────────────────────────────────────────
    CreateSubDocumentUseCase,
    GetSubDocumentsUseCase,
    UpdateSubDocumentUseCase,
    DeleteSubDocumentUseCase,

    // ── Repository ────────────────────────────────────────────────────────
    {
      provide: SUB_DOCUMENT_REPOSITORY,
      useClass: PrismaSubDocumentRepository,
    },
  ],
})
export class SubDocumentModule { }
