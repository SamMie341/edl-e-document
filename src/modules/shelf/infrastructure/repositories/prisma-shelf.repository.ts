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
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    params: ShelfFilterParams,
  ): Promise<{ data: Shelf[]; total: number }> {
    const {
      page = 1,
      limit = 10,
      search,
      lockerId,
      warehouseId,
      branchId,
      divisionId,
      status,
    } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (lockerId) where.lockerId = lockerId;

    // Build locker → warehouse nested filter
    // ໃຊ້ `locker: { is: { ... } }` ເພື່ອ:
    //  1. ບັງຄັບວ່າ shelf ຕ້ອງມີ locker
    //  2. locker → warehouse ຕ້ອງຢູ່ໃນ branch/division ຂອງ user
    if (warehouseId || branchId || divisionId) {
      const warehouseFilter: any = {};
      if (warehouseId) warehouseFilter.id = warehouseId;
      if (branchId) warehouseFilter.branchId = branchId;
      if (divisionId) warehouseFilter.divisionId = divisionId;

      where.locker = { is: { warehouse: { is: warehouseFilter } } };
    }

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [models, total] = await Promise.all([
      this.prisma.shelfModel.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.shelfModel.count({ where }),
    ]);

    return {
      data: models.map(ShelfMapper.toDomain),
      total,
    };
  }

  async create(data: any): Promise<Shelf> {
    // const existing = await this.prisma.shelfModel.findUnique({
    //     where: { code: data.code }
    // });
    // if (existing) {
    //     throw new ConflictException(`ລະຫັດຊັ້ນວາງ '${data.code}' ມີຢູ່ແລ້ວ`);
    // }

    const model = await this.prisma.shelfModel.create({ data });
    return ShelfMapper.toDomain(model);
  }

  async findByLockerId(lockerId: string): Promise<Shelf[]> {
    const models = await this.prisma.shelfModel.findMany({
      where: { lockerId, status: 'A' },
      orderBy: { name: 'asc' },
    });
    return models.map((model) => ShelfMapper.toDomain(model));
  }

  async update(id: string, data: any): Promise<Shelf> {
    const existing = await this.prisma.shelfModel.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('ບໍ່ພົບຊັ້ນວາງນີ້ໃນລະບົບ');
    }

    // Check if new code conflicts with another shelf
    // if (data.code && data.code !== existing.code) {
    //     const codeExists = await this.prisma.shelfModel.findUnique({
    //         where: { code: data.code }
    //     });
    //     if (codeExists) {
    //         throw new ConflictException(`ລະຫັດຊັ້ນວາງ '${data.code}' ມີຢູ່ແລ້ວ`);
    //     }
    // }

    const model = await this.prisma.shelfModel.update({ where: { id }, data });
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
