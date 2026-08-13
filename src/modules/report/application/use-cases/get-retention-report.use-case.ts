import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';

export interface RetentionReportFilter {
  page?: number;
  limit?: number;
  retentionStatus?: string;
  departmentId?: number;
  divisionId?: number;
  warehouseId?: string;
  lockerId?: string;
  shelfId?: string;
  startDate?: string;
  endDate?: string;
  // Scope override (from RBAC)
  forcedDepartmentId?: number;
  forcedDivisionId?: number;
}

@Injectable()
export class GetRetentionReportUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(filter: RetentionReportFilter) {
    const {
      page = 1,
      limit = 20,
      retentionStatus,
      warehouseId,
      lockerId,
      shelfId,
      startDate,
      endDate,
      forcedDepartmentId,
      forcedDivisionId,
    } = filter;

    const departmentId = forcedDepartmentId ?? filter.departmentId;
    const divisionId = forcedDivisionId ?? filter.divisionId;
    const skip = (page - 1) * limit;
    const now = new Date();

    // ─── Build storage scope ──────────────────────────────────────────────────
    let folderWhere: Record<string, unknown> | undefined;
    if (shelfId) {
      folderWhere = { shelfId };
    } else if (lockerId) {
      folderWhere = { shelf: { lockerId } };
    } else if (warehouseId) {
      folderWhere = { shelf: { locker: { warehouseId } } };
    }

    // ─── Build retention status filter ────────────────────────────────────────
    let retentionWhere: Record<string, unknown> = {};
    if (retentionStatus) {
      switch (retentionStatus) {
        case 'DESTROYABLE':
          retentionWhere = { docExpire: { lte: now }, isContractBound: false };
          break;
        case 'EXPIRED':
          retentionWhere = { docExpire: { lt: now } };
          break;
        case 'DESTROYABLE_HOLD':
          retentionWhere = { isContractBound: true };
          break;
        case 'ACTIVE':
          retentionWhere = { docExpire: { gt: now }, isContractBound: false };
          break;
        default:
          // ຖ້າບໍ່ລະບຸ ຫຼື ທຸກ — ສະແດງທຸກສະຖານະ
          break;
      }
    } else {
      // default: ສະແດງສະເພາະ DESTROYABLE, EXPIRED, DESTROYABLE_HOLD
      retentionWhere = {
        OR: [
          { docExpire: { lte: now }, isContractBound: false },
          { isContractBound: true },
        ],
      };
    }

    // ─── Date range for docExpire ─────────────────────────────────────────────
    const expireDateRange: Record<string, unknown> =
      startDate || endDate
        ? {
            docExpire: {
              ...(startDate ? { gte: new Date(startDate) } : {}),
              ...(endDate ? { lte: new Date(endDate) } : {}),
            },
          }
        : {};

    const where: Record<string, unknown> = {
      isDeleted: false,
      ...retentionWhere,
      ...expireDateRange,
      ...(departmentId ? { departmentId } : {}),
      ...(divisionId ? { divisionId } : {}),
      ...(folderWhere ? { folder: { is: folderWhere } } : {}),
    };

    // ─── Run queries in parallel ──────────────────────────────────────────────
    const [total, data, destroyableCount, expiredCount, contractBoundCount] =
      await Promise.all([
        this.prisma.documentModel.count({ where }),
        this.prisma.documentModel.findMany({
          where,
          skip,
          take: limit,
          orderBy: { docExpire: 'asc' },
          select: {
            id: true,
            docNo: true,
            shortName: true,
            title: true,
            docDate: true,
            docExpire: true,
            isContractBound: true,
            qrCode: true,
            departmentId: true,
            divisionId: true,
            documentType: {
              select: { id: true, code: true, name: true },
            },
            folder: {
              select: {
                id: true,
                name: true,
                code: true,
                locationRef: true,
                shelf: {
                  select: {
                    id: true,
                    name: true,
                    locker: {
                      select: {
                        id: true,
                        code: true,
                        name: true,
                        warehouse: {
                          select: { id: true, code: true, name: true },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        }),
        // Summary counts
        this.prisma.documentModel.count({
          where: {
            ...(departmentId ? { departmentId } : {}),
            ...(divisionId ? { divisionId } : {}),
            docExpire: { lte: now },
            isContractBound: false,
          },
        }),
        this.prisma.documentModel.count({
          where: {
            ...(departmentId ? { departmentId } : {}),
            ...(divisionId ? { divisionId } : {}),
            docExpire: { lt: now },
          },
        }),
        this.prisma.documentModel.count({
          where: {
            ...(departmentId ? { departmentId } : {}),
            ...(divisionId ? { divisionId } : {}),
            isContractBound: true,
          },
        }),
      ]);

    // ─── Compute retentionStatus per document ─────────────────────────────────
    const processedData = data.map((doc) => {
      let computedStatus: string;
      if (doc.isContractBound) {
        computedStatus = 'DESTROYABLE_HOLD';
      } else if (doc.docExpire <= now) {
        computedStatus = 'DESTROYABLE';
      } else {
        computedStatus = 'ACTIVE';
      }
      const daysUntilExpiry = Math.ceil(
        (doc.docExpire.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );
      return { ...doc, retentionStatus: computedStatus, daysUntilExpiry };
    });

    return {
      summary: {
        total,
        destroyable: destroyableCount,
        expired: expiredCount,
        destroyableHold: contractBoundCount,
      },
      data: processedData,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
