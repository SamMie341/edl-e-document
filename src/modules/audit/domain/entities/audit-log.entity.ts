import { AuditAction } from 'src/core/constants/audit-action.enum';

export class AuditLog {
  constructor(
    public readonly id: string,
    public readonly action: AuditAction | string,
    public readonly details: string | null,
    public readonly entityId: string,
    public readonly entityType: string,
    public readonly actorId: string,
    public readonly createdAt: Date,
  ) {}
}
