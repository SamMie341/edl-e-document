import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  IShelfRepository,
  ShelfFilterParams,
} from '../../domain/repositories/shelf.repositories.interface';
import { Shelf } from '../../domain/entitites/shelf.entity';
import { PrismaService } from 'src/core/database/prisma.service';
import { ShelfMapper } from '../mappers/shelf.mapper';

@Injectable()
export class PrismaShelfRepository implements IShelfRepository {
  constructor(private readonly prisma: PrismaService) { }

  async findAll(
    params: ShelfFilterParams,
  ): Promise<{ data: Shelf[]; total: number }> {
    const {
      page = 1,
      limit = 10,
      search,
      lockerId,
      warehouseId,
      addressId,
      status,
    } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (lockerId) where.lockerId = lockerId;

    if (warehouseId || addressId) {
      const warehouseFilter: any = {};
      if (warehouseId) warehouseFilter.id = warehouseId;
      if (addressId) warehouseFilter.addressId = addressId;
      where.locker = { is: { warehouse: { is: warehouseFilter } } };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [models, total] = await Promise.all([
      this.prisma.shelfModel.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { locker: true, folders: true, _count: { select: { folders: true } } },
      }),
      this.prisma.shelfModel.count({ where }),
    ]);

    return {
      data: models.map(ShelfMapper.toDomain),
      total,
    };
  }

  async create(data: any): Promise<Shelf> {
    const model = await this.prisma.shelfModel.create({
      data,
      include: {
        _count: { select: { folders: true } }
      },
    });
    return ShelfMapper.toDomain(model);
  }

  async findById(id: string): Promise<Shelf | null> {
    const model = await this.prisma.shelfModel.findUnique({
      where: { id },
      include: {
        locker: true,
        folders: true,
        _count: { select: { folders: true } }
      },
    });
    if (!model) throw new NotFoundException('ບໍ່ພົບຊັ້ນວາງນີ້ໃນລະບົບ');
    return ShelfMapper.toDomain(model);
  }

  async findByLockerId(lockerId: string): Promise<Shelf[]> {
    const models = await this.prisma.shelfModel.findMany({
      where: { lockerId, status: 'A' },
      orderBy: { name: 'asc' },
      include: { _count: { select: { folders: true } } },
    });
    return models.map((model) => ShelfMapper.toDomain(model));
  }

  async update(id: string, data: any): Promise<Shelf> {
    const existing = await this.prisma.shelfModel.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('ບໍ່ພົບຊັ້ນວາງນີ້ໃນລະບົບ');
    }
    const model = await this.prisma.shelfModel.update({
      where: { id },
      data,
      include: { _count: { select: { folders: true } } },
    });
    return ShelfMapper.toDomain(model);
  }

  async delete(id: string): Promise<void> {
    const existing = await this.prisma.shelfModel.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('ບໍ່ພົບຊັ້ນວາງນີ້ໃນລະບົບ');
    }
    await this.prisma.shelfModel.delete({ where: { id } });
  }
}
