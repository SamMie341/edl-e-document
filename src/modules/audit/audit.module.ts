import { Module } from '@nestjs/common';
import { AUDIT_LOG_REPOSITORY } from './domain/repositories/audit-log.repository.interface';
import { PrismaAuditLogRepository } from './infrastructure/repositories/prisma-audit-log.repository';
import { AuditService } from './application/services/audit.service';
import { AuditController } from './presentation/controllers/audit.controller';
import { GetAuditLogsUseCase } from './application/use-cases/get-audit-logs.use-case';
import { GetAuditLogByIdUseCase } from './application/use-cases/get-audit-log-by-id.use-case';

@Module({
  controllers: [AuditController],
  providers: [
    {
      provide: AUDIT_LOG_REPOSITORY,
      useClass: PrismaAuditLogRepository,
    },
    AuditService,
    GetAuditLogsUseCase,
    GetAuditLogByIdUseCase,
  ],
  exports: [
    AUDIT_LOG_REPOSITORY,
    AuditService,
    GetAuditLogsUseCase,
    GetAuditLogByIdUseCase,
  ],
})
export class AuditModule {}
