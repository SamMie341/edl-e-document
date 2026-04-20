import { AuditLog } from "../entities/audit-log.entity";

export const AUDIT_LOG_REPOSITORY = Symbol('AUDIT_LOG_REPOSITORY');

export interface IAuditLogRepository {
    save(log: AuditLog): Promise<void>;
    findByDocumentId(documentId: string): Promise<AuditLog[]>;
}