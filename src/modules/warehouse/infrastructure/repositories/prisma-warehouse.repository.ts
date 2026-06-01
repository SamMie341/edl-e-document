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

@Injectable()
export class PrismaWarehouseRepository implements IWarehouseRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    params: WarehouseFilterParams,
  ): Promise<{ data: Warehouse[]; total: number }> {
    const {
      page = 1,
      limit = 10,
      search,
      branchId,
      divisionId,
      status,
    } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (branchId !== undefined && !isNaN(branchId)) where.branchId = branchId;

    // ໃຊ້ AND array ເພື່ອລວມ divisionId filter + search filter ໂດຍບໍ່ conflict
    const andConditions: any[] = [];

    if (divisionId !== undefined && !isNaN(divisionId)) {
      andConditions.push({ divisionId: divisionId });
    }

    if (search) {
      andConditions.push({
        OR: [
          { code: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    const [models, total] = await Promise.all([
      this.prisma.warehouseModel.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { division: true, address: true },
      }),
      this.prisma.warehouseModel.count({ where }),
    ]);

    return { data: models.map(WarehouseMapper.toDomain), total };
  }

  async create(data: any): Promise<Warehouse> {
    let newCode = '0001';

    // Find the last created warehouse to extract its code number
    const lastWarehouse = await this.prisma.warehouseModel.findFirst({
      where: { code: { startsWith: '' } },
      orderBy: { createdAt: 'desc' },
    });

    if (lastWarehouse && lastWarehouse.code) {
      const match = lastWarehouse.code.match(/(\d+)/);
      if (match && match[1]) {
        const nextNumber = parseInt(match[1], 10) + 1;
        newCode = `${String(nextNumber).padStart(4, '0')}`;
      }
    }

    // Ensure uniqueness and handle race conditions
    let isUnique = false;
    let attemptNumber = parseInt(newCode.replace('', ''), 10) || 1;

    while (!isUnique) {
      const codeToCheck = `${String(attemptNumber).padStart(4, '0')}`;
      const existing = await this.prisma.warehouseModel.findUnique({
        where: { code: codeToCheck },
      });
      if (!existing) {
        data.code = codeToCheck;
        isUnique = true;
      } else {
        attemptNumber++;
      }
    }
    const model = await this.prisma.warehouseModel.create({ data });
    return WarehouseMapper.toDomain(model);
  }

  async findByBranchId(branchId: number): Promise<Warehouse[]> {
    const models = await this.prisma.warehouseModel.findMany({
      where: { branchId: Number(branchId), status: 'A' },
      orderBy: { code: 'asc' },
      include: {
        branch: {
          include: { divisions: true, addresses: true },
        },
      },
    });
    return models.map((model) => WarehouseMapper.toDomain(model));
  }

  async update(id: string, data: any): Promise<Warehouse> {
    const existing = await this.prisma.warehouseModel.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('ບໍ່ພົບສາງນີ້ໃນລະບົບ');
    }
    const model = await this.prisma.warehouseModel.update({
      where: { id },
      data,
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
    await this.prisma.warehouseModel.delete({ where: { id } });
  }
}
