import { Warehouse } from './../../domain/entities/warehouse.entity';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  WarehouseFilterParams,
  IWarehouseRepository,
} from '../../domain/repositories/warehouse.repository.interface';
import { PrismaService } from 'src/core/database/prisma.service';
import { WarehouseMapper } from '../mappers/warehouse.mapper';
import { contains } from 'class-validator';

@Injectable()
export class PrismaWarehouseRepository implements IWarehouseRepository {
  constructor(private readonly prisma: PrismaService) { }

  async findAll(
    params: WarehouseFilterParams,
  ): Promise<{ data: Warehouse[]; total: number }> {
    const { page = 1, limit = 10, search, status, departmentId, divisionId, divisionIds } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (departmentId) where.departmentId = departmentId;
    if (divisionId) where.divisionId = divisionId;
    if (divisionIds) {
      where.divisionId = { in: divisionIds };
    }

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { department: { name: { contains: search, mode: 'insensitive' } } },
        { division: { name: { contains: search, mode: 'insensitive' } } },
        // { locker: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [models, total] = await Promise.all([
      this.prisma.warehouseModel.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { department: true, division: true, lockers: true },
      }),
      this.prisma.warehouseModel.count({ where }),
    ]);

    return { data: models.map(WarehouseMapper.toDomain), total };
  }

  async findById(id: string): Promise<Warehouse | null> {
    const model = await this.prisma.warehouseModel.findUnique({
      where: { id },
      include: { department: true, division: true },
    });
    if (!model) return null;
    return WarehouseMapper.toDomain(model);
  }

  async getDropdown(filters?: { departmentId?: number; divisionId?: number; divisionIds?: number[] }): Promise<{ id: string; name: string }[]> {
    const where: any = { status: 'A' };
    if (filters?.departmentId) where.departmentId = filters.departmentId;
    if (filters?.divisionId) where.divisionId = filters.divisionId;
    if (filters?.divisionIds) {
      where.divisionId = { in: filters.divisionIds };
    }
    return this.prisma.warehouseModel.findMany({
      where,
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async create(data: any): Promise<Warehouse> {
    if (data.departmentId) {
      const dep = await this.prisma.departmentModel.findUnique({
        where: { id: data.departmentId },
      });
      if (!dep) {
        throw new NotFoundException('ບໍ່ພົບພະແນກນີ້ໃນລະບົບ');
      }
    }

    if (data.divisionId) {
      const div = await this.prisma.divisionModel.findUnique({
        where: { id: data.divisionId },
      });
      if (!div) {
        throw new NotFoundException('ບໍ່ພົບຂະແໜງນີ້ໃນລະບົບ');
      }
    }

    const model = await this.prisma.warehouseModel.create({
      data,
      include: { department: true, division: true },
    });
    return WarehouseMapper.toDomain(model);
  }

  async update(id: string, data: any): Promise<Warehouse> {
    const existing = await this.prisma.warehouseModel.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('ບໍ່ພົບສາງນີ້ໃນລະບົບ');
    }

    if (data.departmentId) {
      const dep = await this.prisma.departmentModel.findUnique({
        where: { id: data.departmentId },
      });
      if (!dep) {
        throw new NotFoundException('ບໍ່ພົບພະແນກນີ້ໃນລະບົບ');
      }
    }

    if (data.divisionId) {
      const div = await this.prisma.divisionModel.findUnique({
        where: { id: data.divisionId },
      });
      if (!div) {
        throw new NotFoundException('ບໍ່ພົບຂະແໜງນີ້ໃນລະບົບ');
      }
    }

    const model = await this.prisma.warehouseModel.update({
      where: { id },
      data,
      include: { department: true, division: true },
    });
    return WarehouseMapper.toDomain(model);
  }

  async delete(id: string): Promise<void> {
    const existing = await this.prisma.warehouseModel.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('ບໍ່ພົບສາງນີ້ໃນລະບົບ');
    }

    const lockersCount = await this.prisma.lockerModel.count({
      where: { warehouseId: id },
    });
    if (lockersCount > 0) {
      throw new ConflictException(
        'ບໍ່ສາມາດລົບສາງນີ້ໄດ້ ເພາະຍັງມີຕູ້ Locker ຢູ່ພາຍໃນ. ກະລຸນາລົບຕູ້ Locker ທັງໝົດກ່ອນ.',
      );
    }

    await this.prisma.warehouseModel.delete({ where: { id } });
  }
}
