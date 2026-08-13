import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';

export type StorageGroupBy = 'warehouse' | 'locker' | 'shelf';

export interface StorageReportFilter {
  departmentId?: number;
  divisionId?: number;
  warehouseId?: string;
  groupBy?: StorageGroupBy;
  // Scope override (from RBAC)
  forcedDepartmentId?: number;
  forcedDivisionId?: number;
}

@Injectable()
export class GetStorageReportUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(filter: StorageReportFilter) {
    const {
      warehouseId,
      groupBy = 'warehouse',
      forcedDepartmentId,
      forcedDivisionId,
    } = filter;

    const departmentId = forcedDepartmentId ?? filter.departmentId;
    const divisionId = forcedDivisionId ?? filter.divisionId;

    // ─── Build warehouse scope ────────────────────────────────────────────────
    const warehouseWhere: Record<string, unknown> = {
      ...(departmentId ? { departmentId } : {}),
      ...(divisionId ? { divisionId } : {}),
      ...(warehouseId ? { id: warehouseId } : {}),
    };

    // ─── Aggregate total shelf capacity ──────────────────────────────────────
    const shelfCapacity = await this.prisma.shelfModel.aggregate({
      _sum: { maxQty: true },
      where: {
        locker: { warehouse: warehouseWhere },
      },
    });
    const totalCapacity = shelfCapacity._sum.maxQty ?? 0;

    // ─── Count total used folders ─────────────────────────────────────────────
    const usedCapacity = await this.prisma.folderModel.count({
      where: {
        shelf: { locker: { warehouse: warehouseWhere } },
      },
    });

    const usagePercentage =
      totalCapacity > 0
        ? Number(((usedCapacity / totalCapacity) * 100).toFixed(2))
        : 0;

    // ─── Build breakdown data ────────────────────────────────────────────────
    const warehouses = await this.prisma.warehouseModel.findMany({
      where: warehouseWhere,
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        status: true,
        departmentId: true,
        divisionId: true,
        lockers: {
          select: {
            id: true,
            code: true,
            name: true,
            status: true,
            shelves: {
              select: {
                id: true,
                name: true,
                status: true,
                maxQty: true,
                _count: { select: { folders: true } },
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    // ─── Transform data based on groupBy ─────────────────────────────────────
    const data = warehouses.map((wh) => {
      const whTotalCapacity = wh.lockers.reduce(
        (sum, locker) =>
          sum + locker.shelves.reduce((s, shelf) => s + shelf.maxQty, 0),
        0,
      );
      const whUsedCapacity = wh.lockers.reduce(
        (sum, locker) =>
          sum +
          locker.shelves.reduce((s, shelf) => s + shelf._count.folders, 0),
        0,
      );
      const whUsagePct =
        whTotalCapacity > 0
          ? Number(((whUsedCapacity / whTotalCapacity) * 100).toFixed(2))
          : 0;

      const base = {
        warehouseId: wh.id,
        warehouseCode: wh.code,
        warehouseName: wh.name,
        status: wh.status,
        departmentId: wh.departmentId,
        divisionId: wh.divisionId,
        totalCapacity: whTotalCapacity,
        usedCapacity: whUsedCapacity,
        availableCapacity: whTotalCapacity - whUsedCapacity,
        usagePercentage: whUsagePct,
      };

      if (groupBy === 'warehouse') {
        return base;
      }

      // groupBy: locker or shelf
      const lockers = wh.lockers.map((locker) => {
        const lockerTotal = locker.shelves.reduce(
          (s, shelf) => s + shelf.maxQty,
          0,
        );
        const lockerUsed = locker.shelves.reduce(
          (s, shelf) => s + shelf._count.folders,
          0,
        );
        const lockerPct =
          lockerTotal > 0
            ? Number(((lockerUsed / lockerTotal) * 100).toFixed(2))
            : 0;

        const lockerBase = {
          lockerId: locker.id,
          lockerCode: locker.code,
          lockerName: locker.name,
          status: locker.status,
          totalCapacity: lockerTotal,
          usedCapacity: lockerUsed,
          availableCapacity: lockerTotal - lockerUsed,
          usagePercentage: lockerPct,
        };

        if (groupBy === 'locker') {
          return lockerBase;
        }

        // groupBy: shelf
        const shelves = locker.shelves.map((shelf) => ({
          shelfId: shelf.id,
          shelfName: shelf.name,
          status: shelf.status,
          totalCapacity: shelf.maxQty,
          usedCapacity: shelf._count.folders,
          availableCapacity: shelf.maxQty - shelf._count.folders,
          usagePercentage:
            shelf.maxQty > 0
              ? Number(
                  ((shelf._count.folders / shelf.maxQty) * 100).toFixed(2),
                )
              : 0,
        }));

        return { ...lockerBase, shelves };
      });

      return { ...base, lockers };
    });

    return {
      summary: {
        totalCapacity,
        usedCapacity,
        availableCapacity: totalCapacity - usedCapacity,
        usagePercentage,
        totalWarehouses: warehouses.length,
        totalLockers: warehouses.reduce(
          (sum, wh) => sum + wh.lockers.length,
          0,
        ),
        totalShelves: warehouses.reduce(
          (sum, wh) =>
            sum +
            wh.lockers.reduce((s, locker) => s + locker.shelves.length, 0),
          0,
        ),
      },
      data,
    };
  }
}
