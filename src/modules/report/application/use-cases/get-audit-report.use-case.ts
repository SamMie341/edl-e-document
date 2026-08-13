import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';

export interface AuditReportFilter {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  action?: string;
  entityType?: string;
  actorId?: string;
  departmentId?: number;
  divisionId?: number;
  search?: string;
  // Scope override (from RBAC)
  forcedDepartmentId?: number;
}

@Injectable()
export class GetAuditReportUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(filter: AuditReportFilter) {
    const {
      page = 1,
      limit = 20,
      startDate,
      endDate,
      action,
      entityType,
      actorId,
      search,
      forcedDepartmentId,
    } = filter;

    const departmentId = forcedDepartmentId ?? filter.departmentId;
    const divisionId = filter.divisionId;
    const skip = (page - 1) * limit;

    // ─── Build where clause ───────────────────────────────────────────────────
    const where: Record<string, unknown> = {
      ...(departmentId ? { departmentId } : {}),
      ...(divisionId ? { divisionId } : {}),
      ...(action ? { action } : {}),
      ...(entityType ? { entityType } : {}),
      ...(actorId ? { actorId } : {}),
      ...(startDate || endDate
        ? {
            createdAt: {
              ...(startDate ? { gte: new Date(startDate) } : {}),
              ...(endDate ? { lte: new Date(endDate) } : {}),
            },
          }
        : {}),
      ...(search
        ? {
            OR: [
              { action: { contains: search, mode: 'insensitive' } },
              { details: { contains: search, mode: 'insensitive' } },
              { entityType: { contains: search, mode: 'insensitive' } },
              { entityId: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    // ─── Run queries in parallel ──────────────────────────────────────────────
    const [total, data, actionGroups] = await Promise.all([
      this.prisma.auditLogModel.count({ where }),
      this.prisma.auditLogModel.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          action: true,
          details: true,
          status: true,
          entityType: true,
          entityId: true,
          ipAddress: true,
          method: true,
          createdAt: true,
          departmentId: true,
          divisionId: true,
          actor: {
            select: {
              id: true,
              empCode: true,
              firstNameLa: true,
              lastNameLa: true,
              firstNameEng: true,
              lastNameEng: true,
            },
          },
          department: {
            select: { id: true, code: true, name: true },
          },
          division: {
            select: { id: true, code: true, name: true },
          },
        },
      }),
      // Summary: group by action
      this.prisma.auditLogModel.groupBy({
        by: ['action'],
        _count: { id: true },
        where,
        orderBy: { _count: { id: 'desc' } },
      }),
    ]);

    // ─── Build byAction summary ───────────────────────────────────────────────
    const byAction: Record<string, number> = {};
    for (const group of actionGroups) {
      byAction[group.action] = group._count.id;
    }

    // ─── Build byEntityType summary ───────────────────────────────────────────
    const entityTypeGroups = await this.prisma.auditLogModel.groupBy({
      by: ['entityType'],
      _count: { id: true },
      where,
      orderBy: { _count: { id: 'desc' } },
    });

    const byEntityType: Record<string, number> = {};
    for (const group of entityTypeGroups) {
      const key = group.entityType ?? 'unknown';
      byEntityType[key] = group._count.id;
    }

    return {
      summary: {
        total,
        byAction,
        byEntityType,
      },
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
