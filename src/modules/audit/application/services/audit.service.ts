import { Inject, Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { AuditAction } from 'src/core/constants/audit-action.enum';
import { AuditLog } from '../../domain/entities/audit-log.entity';
import * as auditLogRepositoryInterface from '../../domain/repositories/audit-log.repository.interface';

export interface CreateAuditLogParams {
  action: AuditAction | string;
  details?: string | null;
  entityId?: string | null;
  entityType?: string | null;
  actorId?: string | null;
  status?: string | null;
  departmentId?: number | null;
  divisionId?: number | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  method?: string | null;
  path?: string | null;
  oldValue?: any;
  newValue?: any;
  payload?: any;
}

@Injectable()
export class AuditService {
  constructor(
    @Inject(auditLogRepositoryInterface.AUDIT_LOG_REPOSITORY)
    private readonly auditLogRepository: auditLogRepositoryInterface.IAuditLogRepository,
  ) { }

  async log(params: CreateAuditLogParams): Promise<void> {
    const log = new AuditLog(
      uuidv4(),
      params.action,
      params.details ?? null,
      params.entityId ?? null,
      params.entityType ?? null,
      params.actorId ?? null,
      new Date(),
      params.status ?? 'SUCCESS',
      params.departmentId ?? null,
      params.divisionId ?? null,
      params.ipAddress ?? null,
      params.userAgent ?? null,
      params.method ?? null,
      params.path ?? null,
      params.oldValue,
      params.newValue,
      params.payload,
    );

    await this.auditLogRepository.save(log);
  }

  async findByDocumentId(documentId: string): Promise<AuditLog[]> {
    return this.auditLogRepository.findByDocumentId(documentId);
  }
}
