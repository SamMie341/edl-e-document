import { Module } from "@nestjs/common";
import { AUDIT_LOG_REPOSITORY } from "./domain/repositories/audit-log.repository.interface";
import { PrismaAuditLogRepository } from "./infrastructure/repositories/prisma-audit-log.repository";

@Module({
    providers: [
        {
            provide: AUDIT_LOG_REPOSITORY,
            useClass: PrismaAuditLogRepository,
        },
    ],
    exports: [AUDIT_LOG_REPOSITORY],
})
export class AuditModule { }