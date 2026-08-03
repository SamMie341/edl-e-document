import {
  BadRequestException,
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
      departmentId,
      divisionId,
      status,
    } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (lockerId) where.lockerId = lockerId;

    if (warehouseId || departmentId || divisionId) {
      const warehouseFilter: any = {};
      if (warehouseId) warehouseFilter.id = warehouseId;
      if (departmentId) warehouseFilter.departmentId = departmentId;
      if (divisionId) warehouseFilter.divisionId = divisionId;
      where.locker = { is: { warehouse: { is: warehouseFilter } } };
    }

    if (search) {
      where.OR = [
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
        include: {
          locker: {
            include: {
              warehouse: {
                include: {
                  department: true,
                  division: true,
                },
              },
            },
          },
          folders: true,
          _count: { select: { folders: true } }
        },
      }),
      this.prisma.shelfModel.count({ where }),
    ]);

    return {
      data: models.map(ShelfMapper.toDomain),
      total,
    };
  }

  async createMany(dataList: any[]): Promise<Shelf[]> {
    const inputKeys = dataList.map((d) => `${d.lockerId}_${d.name || ''}`);
    const hasSelfDuplicates = inputKeys.some((val, i) => inputKeys.indexOf(val) !== i);
    if (hasSelfDuplicates) {
      throw new ConflictException(`ມີຊື່ຊັ້ນວາງຊ້ຳກັນພາຍໃນຕູ້ Locker ດຽວກัน ໃນຂໍ້ມູນທີ່ສົ່ງມາ`);
    }

    const lockerIds = Array.from(new Set(dataList.map((d) => d.lockerId)));
    const lockers = await this.prisma.lockerModel.findMany({
      where: { id: { in: lockerIds } },
    });
    if (lockers.length !== lockerIds.length) {
      throw new NotFoundException('ບໍ່ພົບຕູ້ Locker ບາງລາຍການໃນລະບົບ');
    }

    for (const data of dataList) {
      if (data.name) {
        const existing = await this.prisma.shelfModel.findFirst({
          where: {
            lockerId: data.lockerId,
            name: data.name,
          },
        });
        if (existing) {
          throw new ConflictException(
            `ຊື່ຊັ້ນວາງ '${data.name}' ຖືກໃຊ້ງານແລ້ວໃນຕູ້ Locker ນີ້`,
          );
        }
      }
    }

    const createdModels = await this.prisma.$transaction(
      dataList.map((data) =>
        this.prisma.shelfModel.create({
          data,
          include: {
            _count: { select: { folders: true } },
          },
        }),
      ),
    );

    return createdModels.map(ShelfMapper.toDomain);
  }

  async findById(id: string): Promise<Shelf | null> {
    const model = await this.prisma.shelfModel.findUnique({
      where: { id },
      include: {
        locker: {
          include: {
            warehouse: {
              include: {
                department: true,
                division: true,
              },
            },
          },
        },
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

    const nameToCheck = data.name !== undefined ? data.name : existing.name;
    const lockerIdToCheck = data.lockerId !== undefined ? data.lockerId : existing.lockerId;

    if (nameToCheck) {
      const duplicate = await this.prisma.shelfModel.findFirst({
        where: {
          lockerId: lockerIdToCheck,
          name: nameToCheck,
          NOT: { id },
        },
      });
      if (duplicate) {
        throw new ConflictException(
          `ຊື່ຊັ້ນວາງ '${nameToCheck}' ຖືກໃຊ້ງານແລ້ວໃນຕູ້ Locker ນີ້`,
        );
      }
    }

    if (data.maxQty !== undefined) {
      const foldersCount = await this.prisma.folderModel.count({
        where: { shelfId: id },
      });
      if (data.maxQty < foldersCount) {
        throw new BadRequestException(
          `ບໍ່ສາມາດປ່ຽນຄວາມຈຸເປັນ ${data.maxQty} ໄດ້ ເພາະມີແຟ້ມເອກະສານຢູ່ແລ້ວ ${foldersCount} ແຟ້ມ`,
        );
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

  async getDropdown(params?: ShelfFilterParams): Promise<any[]> {
    const {
      search,
      lockerId,
      warehouseId,
      departmentId,
      divisionId,
      status,
    } = params || {};

    const where: any = {};
    if (status) where.status = status;
    if (lockerId) where.lockerId = lockerId;

    if (warehouseId || departmentId || divisionId) {
      const warehouseFilter: any = {};
      if (warehouseId) warehouseFilter.id = warehouseId;
      if (departmentId) warehouseFilter.departmentId = departmentId;
      if (divisionId) warehouseFilter.divisionId = divisionId;
      where.locker = { is: { warehouse: { is: warehouseFilter } } };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const models = await this.prisma.shelfModel.findMany({
      where,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        status: true,
        maxQty: true,
        lockerId: true,
        _count: { select: { folders: true } },
      },
    });

    return models.map((model) => {
      const folderCount = model._count?.folders ?? 0;
      const remainingQty = model.maxQty - folderCount;
      return {
        id: model.id,
        name: model.name,
        status: model.status,
        maxQty: model.maxQty,
        lockerId: model.lockerId,
        foldersCount: folderCount,
        remainingQty: remainingQty > 0 ? remainingQty : 0,
        isFull: folderCount >= model.maxQty,
      };
    });
  }
}
