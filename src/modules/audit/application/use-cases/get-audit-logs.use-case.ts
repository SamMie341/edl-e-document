import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { QueryAuditLogDto } from '../dtos/query-audit-log.dto';

@Injectable()
export class GetAuditLogsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(dto: QueryAuditLogDto, userRole?: string, userDeptId?: number) {
    const page = Math.max(1, Number(dto.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(dto.limit) || 10));
    const skip = (page - 1) * limit;

    const where: any = {};

    // Filter by branch/department if user is BRANCH_ADMIN
    if (userRole === 'BRANCH_ADMIN' && userDeptId) {
      where.departmentId = userDeptId;
    } else if (dto.departmentId) {
      where.departmentId = Number(dto.departmentId);
    }

    if (dto.divisionId) {
      where.divisionId = Number(dto.divisionId);
    }

    if (dto.action) {
      where.action = { contains: dto.action, mode: 'insensitive' };
    }

    if (dto.entityType) {
      where.entityType = { contains: dto.entityType, mode: 'insensitive' };
    }

    if (dto.entityId) {
      where.entityId = dto.entityId;
    }

    if (dto.actorId) {
      where.actorId = dto.actorId;
    }

    if (dto.status) {
      where.status = dto.status;
    }

    if (dto.startDate || dto.endDate) {
      where.createdAt = {};
      if (dto.startDate) {
        where.createdAt.gte = new Date(dto.startDate);
      }
      if (dto.endDate) {
        const endDate = new Date(dto.endDate);
        endDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = endDate;
      }
    }

    if (dto.search && dto.search.trim() !== '') {
      const search = dto.search.trim();
      where.OR = [
        { action: { contains: search, mode: 'insensitive' } },
        { details: { contains: search, mode: 'insensitive' } },
        { entityType: { contains: search, mode: 'insensitive' } },
        { entityId: { contains: search, mode: 'insensitive' } },
        { path: { contains: search, mode: 'insensitive' } },
        { ipAddress: { contains: search, mode: 'insensitive' } },
        {
          actor: {
            OR: [
              { empCode: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { firstNameLa: { contains: search, mode: 'insensitive' } },
              { lastNameLa: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    const [total, logs] = await Promise.all([
      this.prisma.auditLogModel.count({ where }),
      this.prisma.auditLogModel.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: {
            select: {
              id: true,
              empCode: true,
              email: true,
              firstNameLa: true,
              lastNameLa: true,
            },
          },
          department: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
          division: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
        },
      }),
    ]);

    return {
      data: logs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
