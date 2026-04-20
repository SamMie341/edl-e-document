import { Injectable } from "@nestjs/common";
import { IAuditLogRepository } from "../../domain/repositories/audit-log.repository.interface";
import { PrismaService } from "src/core/database/prisma.service";
import { AuditLog } from "../../domain/entities/audit-log.entity";

@Injectable()
export class PrismaAuditLogRepository implements IAuditLogRepository {
    constructor(private readonly prisma: PrismaService) { }

    async save(log: AuditLog): Promise<void> {
        await this.prisma.auditLogModel.create({
            data: {
                id: log.id,
                action: log.action,
                details: log.details,
                entityId: log.entityId,
                entityType: log.entityType,
                actorId: log.actorId,
                createdAt: log.createdAt,
            }
        });
    }

    async findByDocumentId(entityId: string): Promise<AuditLog[]> {
        const models = await this.prisma.auditLogModel.findMany({
            where: { entityId },
            orderBy: { createdAt: 'desc' },
        });
        return models.map(m => new AuditLog(m.id, m.action, m.details, m.entityId, m.entityType, m.actorId, m.createdAt));
    }
}