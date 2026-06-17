import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  LockerFilterParams,
  ILockerRepository,
} from '../../domain/repositories/locker.repository.interface';
import { Locker } from '../../domain/entities/locker.entity';
import { PrismaService } from 'src/core/database/prisma.service';
import { LockerMapper } from '../mappers/locker.mapper';

@Injectable()
export class PrismaLockerRepository implements ILockerRepository {
  constructor(private readonly prisma: PrismaService) { }

  async findAll(
    params: LockerFilterParams,
  ): Promise<{ data: Locker[]; total: number }> {
    const {
      page = 1,
      limit = 10,
      search,
      warehouseId,
      addressId,
      status,
    } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;

    if (warehouseId || addressId) {
      const warehouseFilter: any = {};
      if (warehouseId) warehouseFilter.id = warehouseId;
      if (addressId) warehouseFilter.addressId = addressId;
      where.warehouse = { is: warehouseFilter };
    }

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [models, total] = await Promise.all([
      this.prisma.lockerModel.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          warehouse: {
            include: {
              address: true,
            },
          },
        },
      }),
      this.prisma.lockerModel.count({ where }),
    ]);

    return {
      data: models.map(LockerMapper.toDomain),
      total
    };
  }

  async findById(id: string): Promise<Locker | null> {
    const model = await this.prisma.lockerModel.findUnique({
      where: { id },
      include: {
        warehouse: {
          include: {
            address: true,
          },
        },
      },
    });
    if (!model) return null;
    return LockerMapper.toDomain(model);
  }

  async create(data: any): Promise<Locker> {
    const existing = await this.prisma.lockerModel.findUnique({
      where: { code: data.code },
    });
    if (existing) {
      throw new ConflictException(`ລະຫັດຕູ້ '${data.code}' ຖືກໃຊ້ງານແລ້ວ`);
    }
    if (data.warehouseId) {
      const warehouse = await this.prisma.warehouseModel.findUnique({
        where: { id: data.warehouseId },
      });
      if (!warehouse) {
        throw new NotFoundException('ບໍ່ພົບສາງນີ້ໃນລະບົບ');
      }
    }
    const model = await this.prisma.lockerModel.create({ data });
    return LockerMapper.toDomain(model);
  }

  async update(id: string, data: any): Promise<Locker> {
    const existing = await this.prisma.lockerModel.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('ບໍ່ພົບຕູ້ Locker ນີ້ໃນລະບົບ');
    }
    if (data.warehouseId) {
      const warehouse = await this.prisma.warehouseModel.findUnique({
        where: { id: data.warehouseId },
      });
      if (!warehouse) {
        throw new NotFoundException('ບໍ່ພົບສາງນີ້ໃນລະບົບ');
      }
    }
    const model = await this.prisma.lockerModel.update({ where: { id }, data });
    return LockerMapper.toDomain(model);
  }

  async delete(id: string): Promise<void> {
    const existing = await this.prisma.lockerModel.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('ບໍ່ພົບຕູ້ Locker ນີ້ໃນລະບົບ');
    }

    const shelvesCount = await this.prisma.shelfModel.count({
      where: { lockerId: id },
    });
    if (shelvesCount > 0) {
      throw new ConflictException(
        'ບໍ່ສາມາດລົບຕູ້ Locker ນີ້ໄດ້ ເພາະຍັງມີຊັ້ນວາງຢູ່ພາຍໃນ. ກະລຸນາລົບຊັ້ນວາງທັງໝົດກ່ອນ.',
      );
    }

    await this.prisma.lockerModel.delete({ where: { id } });
  }
}
