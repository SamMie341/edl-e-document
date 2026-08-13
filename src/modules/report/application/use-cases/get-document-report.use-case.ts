import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';

export interface DocumentReportFilter {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  departmentId?: number;
  divisionId?: number;
  documentTypeId?: string;
  retentionStatus?: string;
  warehouseId?: string;
  lockerId?: string;
  shelfId?: string;
  folderId?: string;
  search?: string;
  // Scope override (from RBAC)
  forcedDepartmentId?: number;
  forcedDivisionId?: number;
}

@Injectable()
export class GetDocumentReportUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(filter: DocumentReportFilter) {
    const {
      page = 1,
      limit = 20,
      startDate,
      endDate,
      documentTypeId,
      retentionStatus,
      warehouseId,
      lockerId,
      shelfId,
      folderId,
      search,
      forcedDepartmentId,
      forcedDivisionId,
    } = filter;

    const departmentId = forcedDepartmentId ?? filter.departmentId;
    const divisionId = forcedDivisionId ?? filter.divisionId;
    const skip = (page - 1) * limit;
    const now = new Date();

    // ─── Build retention status condition ─────────────────────────────────────
    let retentionWhere: Record<string, unknown> = {};
    if (retentionStatus) {
      switch (retentionStatus) {
        case 'ACTIVE':
          retentionWhere = { docExpire: { gt: now }, isContractBound: false };
          break;
        case 'DESTROYABLE':
          retentionWhere = { docExpire: { lte: now }, isContractBound: false };
          break;
        case 'EXPIRED':
          retentionWhere = { docExpire: { lt: now } };
          break;
        case 'DESTROYABLE_HOLD':
          retentionWhere = { isContractBound: true };
          break;
      }
    }

    // ─── Build folder/shelf/locker/warehouse scope ─────────────────────────────
    let folderWhere: Record<string, unknown> | undefined;
    if (folderId) {
      folderWhere = { id: folderId };
    } else if (shelfId) {
      folderWhere = { shelfId };
    } else if (lockerId) {
      folderWhere = { shelf: { lockerId } };
    } else if (warehouseId) {
      folderWhere = { shelf: { locker: { warehouseId } } };
    }

    // ─── Main where clause ───────────────────────────────────────────────────
    const where: Record<string, unknown> = {
      ...retentionWhere,
      ...(departmentId ? { departmentId } : {}),
      ...(divisionId ? { divisionId } : {}),
      ...(documentTypeId ? { documentTypeId } : {}),
      ...(folderWhere ? { folder: { is: folderWhere } } : {}),
      ...(startDate || endDate
        ? {
            docDate: {
              ...(startDate ? { gte: new Date(startDate) } : {}),
              ...(endDate ? { lte: new Date(endDate) } : {}),
            },
          }
        : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { docNo: { contains: search, mode: 'insensitive' } },
              { shortName: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    // ─── Run queries in parallel ──────────────────────────────────────────────
    const [total, data, statusGroups, typeGroups] = await Promise.all([
      this.prisma.documentModel.count({ where }),
      this.prisma.documentModel.findMany({
        where,
        skip,
        take: limit,
        orderBy: { docDate: 'desc' },
        select: {
          id: true,
          docNo: true,
          shortName: true,
          title: true,
          docDate: true,
          docExpire: true,
          isContractBound: true,
          qrCode: true,
          createdAt: true,
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
          user: {
            select: { id: true, empCode: true, firstNameLa: true, lastNameLa: true, firstNameEng: true, lastNameEng: true },
          },
        },
      }),
      // Summary: group by retentionStatus
      this.prisma.documentModel.groupBy({
        by: ['isContractBound'],
        _count: { id: true },
        where,
      }),
      // Summary: group by documentType
      this.prisma.documentModel.groupBy({
        by: ['documentTypeId'],
        _count: { id: true },
        where,
      }),
    ]);

    // ─── Process data: compute retentionStatus per doc ────────────────────────
    const processedData = data.map((doc) => {
      let computedStatus = 'ACTIVE';
      if (doc.isContractBound) {
        computedStatus = 'DESTROYABLE_HOLD';
      } else if (doc.docExpire <= now) {
        computedStatus = 'EXPIRED';
      } else {
        const tenYearsAgo = new Date(
          now.getFullYear() - 10,
          now.getMonth(),
          now.getDate(),
        );
        computedStatus = doc.docExpire <= tenYearsAgo ? 'DESTROYABLE' : 'ACTIVE';
      }
      return { ...doc, retentionStatus: computedStatus };
    });

    // ─── Build summary: by retention status counts ────────────────────────────
    const [activeCount, destroyableCount, expiredCount, contractBoundCount] =
      await Promise.all([
        this.prisma.documentModel.count({
          where: { ...where, docExpire: { gt: now }, isContractBound: false },
        }),
        this.prisma.documentModel.count({
          where: { ...where, docExpire: { lte: now }, isContractBound: false },
        }),
        this.prisma.documentModel.count({
          where: { ...where, docExpire: { lt: now } },
        }),
        this.prisma.documentModel.count({
          where: { ...where, isContractBound: true },
        }),
      ]);

    // ─── Build byType summary ─────────────────────────────────────────────────
    const typeIds = typeGroups
      .map((g) => g.documentTypeId)
      .filter((id): id is string => id !== null);

    const typeDetails =
      typeIds.length > 0
        ? await this.prisma.documentTypeModel.findMany({
            where: { id: { in: typeIds } },
            select: { id: true, code: true, name: true },
          })
        : [];
    const typeMap = new Map(typeDetails.map((t) => [t.id, t]));

    const byType = typeGroups.map((g) => {
      const t = g.documentTypeId ? typeMap.get(g.documentTypeId) : null;
      return {
        documentTypeId: g.documentTypeId,
        documentTypeCode: t?.code ?? null,
        documentTypeName: t?.name ?? 'ບໍ່ລະບຸປະເພດ',
        count: g._count.id,
      };
    });

    return {
      summary: {
        total,
        byStatus: {
          active: activeCount,
          destroyable: destroyableCount,
          expired: expiredCount,
          destroyableHold: contractBoundCount,
        },
        byType,
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
