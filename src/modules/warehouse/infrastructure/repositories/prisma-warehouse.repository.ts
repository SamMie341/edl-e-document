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
  constructor(private readonly prisma: PrismaService) { }

  async findAll(
    params: WarehouseFilterParams,
  ): Promise<{ data: Warehouse[]; total: number }> {
    const { page = 1, limit = 10, search, status } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [models, total] = await Promise.all([
      this.prisma.warehouseModel.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { address: true },
      }),
      this.prisma.warehouseModel.count({ where }),
    ]);

    return { data: models.map(WarehouseMapper.toDomain), total };
  }

  async create(data: any): Promise<Warehouse> {
    let newCode = '0001';

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

    let isUnique = false;
    let attemptNumber = parseInt(newCode, 10) || 1;

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
      include: { address: true },
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
