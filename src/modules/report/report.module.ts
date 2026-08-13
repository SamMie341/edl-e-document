import { Module } from '@nestjs/common';
import { ReportController } from './presentation/controllers/report.controller';
import { GetDocumentReportUseCase } from './application/use-cases/get-document-report.use-case';
import { GetBorrowReportUseCase } from './application/use-cases/get-borrow-report.use-case';
import { GetRetentionReportUseCase } from './application/use-cases/get-retention-report.use-case';
import { GetStorageReportUseCase } from './application/use-cases/get-storage-report.use-case';
import { GetAuditReportUseCase } from './application/use-cases/get-audit-report.use-case';

@Module({
  controllers: [ReportController],
  providers: [
    GetDocumentReportUseCase,
    GetBorrowReportUseCase,
    GetRetentionReportUseCase,
    GetStorageReportUseCase,
    GetAuditReportUseCase,
  ],
})
export class ReportModule {}
