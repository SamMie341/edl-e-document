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
    if (data.lockerId) {
      const locker = await this.prisma.lockerModel.findUnique({
        where: { id: data.lockerId },
      });
      if (!locker) {
        throw new NotFoundException('ບໍ່ພົບຕູ້ Locker ໃນລະບົບ');
      }
    }
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

  async update(id: string, data: any): Promise<Shelf> {
    const existing = await this.prisma.shelfModel.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('ບໍ່ພົບຊັ້ນວາງນີ້ໃນລະບົບ');
    }
    if (data.lockerId) {
      const locker = await this.prisma.lockerModel.findUnique({
        where: { id: data.lockerId },
      });
      if (!locker) {
        throw new NotFoundException('ບໍ່ພົບຕູ້ Locker ໃນລະບົບ');
      }
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

    const foldersCount = await this.prisma.folderModel.count({
      where: { shelfId: id },
    });
    if (foldersCount > 0) {
      throw new ConflictException(
        'ບໍ່ສາມາດລົບຊັ້ນວາງນີ້ໄດ້ ເພາະຍັງມີແຟ້ມເອກະສານຢູ່ພາຍໃນ. ກະລຸນາລົບແຟ້ມເອກະສານທັງໝົດກ່ອນ.',
      );
    }

    await this.prisma.shelfModel.delete({ where: { id } });
  }
}
