import { AuditAction } from 'src/core/constants/audit-action.enum';

export class AuditLog {
  constructor(
    public readonly id: string,
    public readonly action: AuditAction | string,
    public readonly details: string | null = null,
    public readonly entityId: string | null = null,
    public readonly entityType: string | null = null,
    public readonly actorId: string | null = null,
    public readonly createdAt: Date = new Date(),
    public readonly status?: string | null,
    public readonly departmentId?: number | null,
    public readonly divisionId?: number | null,
    public readonly ipAddress?: string | null,
    public readonly userAgent?: string | null,
    public readonly method?: string | null,
    public readonly path?: string | null,
    public readonly oldValue?: any,
    public readonly newValue?: any,
    public readonly payload?: any,
  ) {}
}
