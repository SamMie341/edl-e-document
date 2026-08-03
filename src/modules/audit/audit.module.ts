import { Module } from '@nestjs/common';
import { AUDIT_LOG_REPOSITORY } from './domain/repositories/audit-log.repository.interface';
import { PrismaAuditLogRepository } from './infrastructure/repositories/prisma-audit-log.repository';
import { AuditService } from './application/services/audit.service';

@Module({
  providers: [
    {
      provide: AUDIT_LOG_REPOSITORY,
      useClass: PrismaAuditLogRepository,
    },
    AuditService,
  ],
  exports: [AUDIT_LOG_REPOSITORY, AuditService],
})
export class AuditModule {}
