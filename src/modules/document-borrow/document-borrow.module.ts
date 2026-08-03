import { Module } from '@nestjs/common';
import { DocumentBorrowController } from './presentation/controllers/document-borrow.controller';
import { BorrowDocumentUseCase } from './application/use-cases/borrow-document.use-case';
import { ReturnDocumentUseCase } from './application/use-cases/return-document.use-case';
import { GetBorrowHistoryUseCase } from './application/use-cases/get-borrow-history.use-case';
import { DOCUMENT_BORROW_REPOSITORY } from './domain/repositories/document-borrow.repository.interface';
import { PrismaDocumentBorrowRepository } from './infrastructure/repositories/prisma-document-borrow.repository';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [DocumentBorrowController],
  providers: [
    BorrowDocumentUseCase,
    ReturnDocumentUseCase,
    GetBorrowHistoryUseCase,
    {
      provide: DOCUMENT_BORROW_REPOSITORY,
      useClass: PrismaDocumentBorrowRepository,
    },
  ],
  exports: [DOCUMENT_BORROW_REPOSITORY],
})
export class DocumentBorrowModule {}
