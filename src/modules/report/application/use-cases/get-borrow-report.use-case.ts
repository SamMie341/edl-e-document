import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';

export interface BorrowReportFilter {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  status?: string;
  departmentId?: number;
  divisionId?: number;
  search?: string;
  overdueOnly?: boolean;
  // Scope override (from RBAC)
  forcedDepartmentId?: number;
  forcedDivisionId?: number;
}

@Injectable()
export class GetBorrowReportUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(filter: BorrowReportFilter) {
    const {
      page = 1,
      limit = 20,
      startDate,
      endDate,
      status,
      search,
      overdueOnly = false,
      forcedDepartmentId,
      forcedDivisionId,
    } = filter;

    const departmentId = forcedDepartmentId ?? filter.departmentId;
    const divisionId = forcedDivisionId ?? filter.divisionId;
    const skip = (page - 1) * limit;
    const now = new Date();

    // ─── Build scope filter ───────────────────────────────────────────────────
    const scopeWhere: Record<string, unknown> = {};
    if (departmentId) {
      scopeWhere['OR'] = [
        { items: { some: { document: { is: { departmentId } } } } },
        { toDivision: { is: { departmentId } } },
      ];
    }
    if (divisionId) {
      scopeWhere['toDivisionId'] = divisionId;
    }

    // ─── Build main where clause ──────────────────────────────────────────────
    const where: Record<string, unknown> = {
      ...scopeWhere,
      ...(status ? { status } : {}),
      ...(overdueOnly
        ? {
            status: { in: ['BORROWED', 'PARTIALLY_RETURNED'] },
            dueDate: { lt: now },
          }
        : {}),
      ...(startDate || endDate
        ? {
            borrowedAt: {
              ...(startDate ? { gte: new Date(startDate) } : {}),
              ...(endDate ? { lte: new Date(endDate) } : {}),
            },
          }
        : {}),
      ...(search
        ? {
            OR: [
              { borrower: { contains: search, mode: 'insensitive' } },
              { purpose: { contains: search, mode: 'insensitive' } },
              { note: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    // ─── Run queries in parallel ──────────────────────────────────────────────
    const [total, data, activeCount, returnedCount, overdueCount] =
      await Promise.all([
        this.prisma.documentBorrowModel.count({ where }),
        this.prisma.documentBorrowModel.findMany({
          where,
          skip,
          take: limit,
          orderBy: { borrowedAt: 'desc' },
          select: {
            id: true,
            borrower: true,
            phone: true,
            purpose: true,
            borrowedAt: true,
            dueDate: true,
            status: true,
            toLocation: true,
            note: true,
            createdAt: true,
            toDivision: {
              select: { id: true, code: true, name: true, shortName: true },
            },
            createdBy: {
              select: { id: true, empCode: true, firstNameLa: true, lastNameLa: true, firstNameEng: true, lastNameEng: true },
            },
            items: {
              select: {
                id: true,
                status: true,
                returnedAt: true,
                note: true,
                document: {
                  select: {
                    id: true,
                    docNo: true,
                    title: true,
                    shortName: true,
                    qrCode: true,
                  },
                },
                folder: {
                  select: {
                    id: true,
                    code: true,
                    name: true,
                    locationRef: true,
                  },
                },
              },
            },
          },
        }),
        // Summary: active borrows
        this.prisma.documentBorrowModel.count({
          where: {
            ...scopeWhere,
            status: { in: ['BORROWED', 'PARTIALLY_RETURNED'] },
          },
        }),
        // Summary: returned borrows
        this.prisma.documentBorrowModel.count({
          where: { ...scopeWhere, status: 'RETURNED' },
        }),
        // Summary: overdue borrows
        this.prisma.documentBorrowModel.count({
          where: {
            ...scopeWhere,
            status: { in: ['BORROWED', 'PARTIALLY_RETURNED'] },
            dueDate: { lt: now },
          },
        }),
      ]);

    // ─── Enrich: mark overdue ─────────────────────────────────────────────────
    const processedData = data.map((borrow) => {
      const isOverdue =
        ['BORROWED', 'PARTIALLY_RETURNED'].includes(borrow.status) &&
        borrow.dueDate !== null &&
        borrow.dueDate < now;
      return { ...borrow, isOverdue };
    });

    return {
      summary: {
        total,
        active: activeCount,
        returned: returnedCount,
        overdue: overdueCount,
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
