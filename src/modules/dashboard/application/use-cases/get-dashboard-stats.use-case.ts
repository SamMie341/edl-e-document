import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';

export interface DashboardFilterParams {
  departmentId?: number;
}

export interface DepartmentDocumentStat {
  departmentId: number | null;
  departmentCode: string | null;
  departmentName: string;
  documentCount: number;
}

export interface DocumentTypeStat {
  documentTypeId: string | null;
  documentTypeCode: string | null;
  documentTypeName: string;
  documentCount: number;
}

export interface DivisionDocumentStat {
  divisionId: number | null;
  divisionCode: string | null;
  divisionName: string;
  divisionShortName: string | null;
  documentCount: number;
}

export interface MonthlyGrowthStat {
  month: string; // YYYY-MM
  count: number;
}

export interface DashboardStatsResult {
  summary: {
    warehouses: number;
    lockers: number;
    shelves: number;
    folders: number;
    documentTypes: number;
    documents: number;
    borrows: {
      total: number;
      active: number;
      returned: number;
    };
  };
  borrowAlerts: {
    overdueCount: number;
    upcomingDueCount: number;
  };
  retentionStatus: {
    activeCount: number;
    expiredCount: number;
    contractBoundCount: number;
  };
  storageCapacity: {
    totalCapacity: number;
    usedCapacity: number;
    usagePercentage: number;
  };
  documentsByDepartment: DepartmentDocumentStat[];
  documentsByDocumentType: DocumentTypeStat[];
  documentsByDivision: DivisionDocumentStat[];
  monthlyGrowth: MonthlyGrowthStat[];
}

@Injectable()
export class GetDashboardStatsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(params: DashboardFilterParams = {}): Promise<DashboardStatsResult> {
    const { departmentId } = params;

    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const warehouseWhere = departmentId ? { departmentId } : {};
    const lockerWhere = departmentId ? { warehouse: { departmentId } } : {};
    const shelfWhere = departmentId ? { locker: { warehouse: { departmentId } } } : {};
    const folderWhere = departmentId ? { shelf: { locker: { warehouse: { departmentId } } } } : {};
    const documentWhere = departmentId ? { departmentId } : {};
    const borrowWhere = departmentId
      ? {
          OR: [
            { items: { some: { document: { is: { departmentId } } } } },
            { toDivision: { is: { departmentId } } },
          ],
        }
      : {};

    const [
      warehouseCount,
      lockerCount,
      shelfCount,
      folderCount,
      documentTypeCount,
      documentCount,
      borrowTotalCount,
      borrowActiveCount,
      borrowReturnedCount,
      overdueBorrowCount,
      upcomingBorrowCount,
      activeDocCount,
      expiredDocCount,
      contractBoundDocCount,
      shelfCapacityAggregate,
      departments,
      unassignedDeptDocCount,
      docTypeGroups,
      divisionGroups,
      recentDocs,
    ] = await Promise.all([
      // 1. Core Summary Counts
      this.prisma.warehouseModel.count({ where: warehouseWhere }),
      this.prisma.lockerModel.count({ where: lockerWhere }),
      this.prisma.shelfModel.count({ where: shelfWhere }),
      this.prisma.folderModel.count({ where: folderWhere }),
      this.prisma.documentTypeModel.count(),
      this.prisma.documentModel.count({ where: documentWhere }),
      this.prisma.documentBorrowModel.count({ where: borrowWhere }),
      this.prisma.documentBorrowModel.count({
        where: {
          ...borrowWhere,
          status: { in: ['BORROWED', 'PARTIALLY_RETURNED'] },
        },
      }),
      this.prisma.documentBorrowModel.count({
        where: {
          ...borrowWhere,
          status: 'RETURNED',
        },
      }),

      // 2. Borrow Alerts
      this.prisma.documentBorrowModel.count({
        where: {
          ...borrowWhere,
          status: { in: ['BORROWED', 'PARTIALLY_RETURNED'] },
          dueDate: { lt: now },
        },
      }),
      this.prisma.documentBorrowModel.count({
        where: {
          ...borrowWhere,
          status: { in: ['BORROWED', 'PARTIALLY_RETURNED'] },
          dueDate: { gte: now, lte: sevenDaysLater },
        },
      }),

      // 3. Document Retention & Expiry Status
      this.prisma.documentModel.count({
        where: {
          ...documentWhere,
          docExpire: { gt: now },
        },
      }),
      this.prisma.documentModel.count({
        where: {
          ...documentWhere,
          docExpire: { lte: now },
        },
      }),
      this.prisma.documentModel.count({
        where: {
          ...documentWhere,
          isContractBound: true,
        },
      }),

      // 4. Storage Capacity (Shelf maxQty vs Folder count)
      this.prisma.shelfModel.aggregate({
        _sum: { maxQty: true },
        where: shelfWhere,
      }),

      // 5. Documents by Department
      this.prisma.departmentModel.findMany({
        ...(departmentId ? { where: { id: departmentId } } : {}),
        select: {
          id: true,
          code: true,
          name: true,
          _count: {
            select: { documents: true },
          },
        },
        orderBy: { name: 'asc' },
      }),
      departmentId ? Promise.resolve(0) : this.prisma.documentModel.count({ where: { departmentId: null } }),

      // 6. Documents by Document Type Grouping
      this.prisma.documentModel.groupBy({
        by: ['documentTypeId'],
        _count: { id: true },
        where: documentWhere,
      }),

      // 7. Documents by Division Grouping
      this.prisma.documentModel.groupBy({
        by: ['divisionId'],
        _count: { id: true },
        where: documentWhere,
      }),

      // 8. Monthly Growth (Recent 6 months docs)
      this.prisma.documentModel.findMany({
        where: {
          ...documentWhere,
          createdAt: { gte: sixMonthsAgo },
        },
        select: { createdAt: true },
      }),
    ]);

    // ─── Process Storage Capacity ─────────────────────────────────────────────
    const totalCapacity = shelfCapacityAggregate._sum.maxQty ?? 0;
    const usedCapacity = folderCount;
    const usagePercentage = totalCapacity > 0
      ? Number(((usedCapacity / totalCapacity) * 100).toFixed(2))
      : 0;

    // ─── Process Documents by Department ──────────────────────────────────────
    const documentsByDepartment: DepartmentDocumentStat[] = departments.map((dept) => ({
      departmentId: dept.id,
      departmentCode: dept.code,
      departmentName: dept.name,
      documentCount: dept._count.documents,
    }));

    if (!departmentId && unassignedDeptDocCount > 0) {
      documentsByDepartment.push({
        departmentId: null,
        departmentCode: null,
        departmentName: 'ບໍ່ລະບຸພາກສ່ວນ (Unassigned)',
        documentCount: unassignedDeptDocCount,
      });
    }

    // ─── Process Documents by Document Type ──────────────────────────────────
    const docTypeIds = docTypeGroups
      .map((g) => g.documentTypeId)
      .filter((id): id is string => id !== null);

    const docTypeDetails = docTypeIds.length > 0
      ? await this.prisma.documentTypeModel.findMany({
          where: { id: { in: docTypeIds } },
          select: { id: true, code: true, name: true },
        })
      : [];
    const docTypeMap = new Map(docTypeDetails.map((dt) => [dt.id, dt]));

    const documentsByDocumentType: DocumentTypeStat[] = docTypeGroups.map((g) => {
      const dt = g.documentTypeId ? docTypeMap.get(g.documentTypeId) : null;
      return {
        documentTypeId: g.documentTypeId,
        documentTypeCode: dt?.code ?? null,
        documentTypeName: dt?.name ?? 'ບໍ່ລະບຸປະເພດເອກະສານ (Unassigned)',
        documentCount: g._count.id,
      };
    });

    // ─── Process Documents by Division ───────────────────────────────────────
    const divisionIds = divisionGroups
      .map((g) => g.divisionId)
      .filter((id): id is number => id !== null);

    const divisionDetails = divisionIds.length > 0
      ? await this.prisma.divisionModel.findMany({
          where: { id: { in: divisionIds } },
          select: { id: true, code: true, name: true, shortName: true },
        })
      : [];
    const divisionMap = new Map(divisionDetails.map((d) => [d.id, d]));

    const documentsByDivision: DivisionDocumentStat[] = divisionGroups.map((g) => {
      const div = g.divisionId ? divisionMap.get(g.divisionId) : null;
      return {
        divisionId: g.divisionId,
        divisionCode: div?.code ?? null,
        divisionName: div?.name ?? 'ບໍ່ລະບຸສ່ວນງານ (Unassigned)',
        divisionShortName: div?.shortName ?? null,
        documentCount: g._count.id,
      };
    });

    // ─── Process Monthly Growth (Last 6 Months) ──────────────────────────────
    const monthlyGrowthMap = new Map<string, number>();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyGrowthMap.set(ym, 0);
    }

    for (const doc of recentDocs) {
      const d = new Date(doc.createdAt);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyGrowthMap.has(ym)) {
        monthlyGrowthMap.set(ym, (monthlyGrowthMap.get(ym) || 0) + 1);
      }
    }

    const monthlyGrowth: MonthlyGrowthStat[] = Array.from(monthlyGrowthMap.entries()).map(
      ([month, count]) => ({ month, count }),
    );

    return {
      summary: {
        warehouses: warehouseCount,
        lockers: lockerCount,
        shelves: shelfCount,
        folders: folderCount,
        documentTypes: documentTypeCount,
        documents: documentCount,
        borrows: {
          total: borrowTotalCount,
          active: borrowActiveCount,
          returned: borrowReturnedCount,
        },
      },
      borrowAlerts: {
        overdueCount: overdueBorrowCount,
        upcomingDueCount: upcomingBorrowCount,
      },
      retentionStatus: {
        activeCount: activeDocCount,
        expiredCount: expiredDocCount,
        contractBoundCount: contractBoundDocCount,
      },
      storageCapacity: {
        totalCapacity,
        usedCapacity,
        usagePercentage,
      },
      documentsByDepartment,
      documentsByDocumentType,
      documentsByDivision,
      monthlyGrowth,
    };
  }
}
