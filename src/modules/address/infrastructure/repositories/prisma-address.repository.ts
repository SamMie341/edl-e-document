import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AddressFilterParams,
  IAddressRepository,
} from '../../domain/repositories/address.repositories.interface';
import { Address } from '../../domain/entities/address.entity';
import { PrismaService } from 'src/core/database/prisma.service';
import { AddressMapper } from '../mappers/address.mapper';

@Injectable()
export class PrismaAddressRepository implements IAddressRepository {
  constructor(private readonly prisma: PrismaService) { }

  async getDropdown(filters?: {
    departmentId?: number;
    divisionId?: number;
    userId?: string;
  }): Promise<{ id: string; name: string }[]> {
    const where: any = { status: 'A' };
    if (filters?.departmentId) where.departmentId = filters.departmentId;

    if (filters?.userId) {
      const userDivisions = await this.prisma.userDivisionModel.findMany({
        where: { userId: filters.userId },
        select: { divisionId: true },
      });
      const divisionIds = userDivisions.map((ud) => ud.divisionId);
      where.OR = [
        { divisionId: { in: divisionIds } },
        { divisionId: null },
      ];
    } else if (filters?.divisionId) {
      where.divisionId = filters.divisionId;
    }

    return this.prisma.addressModel.findMany({
      where,
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async create(data: any): Promise<Address> {
    const existing = await this.prisma.addressModel.findUnique({
      where: { code: data.code },
    });
    if (existing) {
      throw new ConflictException('ລະຫັດສະຖານທີ່ນີ້ຖືກໃຊ້ງານແລ້ວ');
    }
    const model = await this.prisma.addressModel.create({
      data,
      include: {
        department: true,
        division: true,
      },
    });
    return AddressMapper.toDomain(model);
  }

  async findAll(
    params: AddressFilterParams,
  ): Promise<{ data: Address[]; total: number }> {
    const { page = 1, limit = 10, search, status } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) where.status = status;
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { details: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [models, total] = await Promise.all([
      this.prisma.addressModel.findMany({
        where,
        skip,
        take: limit,
        include: {
          department: true,
          division: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.addressModel.count({ where }),
    ]);

    return { data: models.map(AddressMapper.toDomain), total };
  }

  async findById(id: string): Promise<Address | null> {
    const model = await this.prisma.addressModel.findUnique({
      where: { id },
      include: {
        department: true,
        division: true,
      },
    });
    if (!model) return null;
    return AddressMapper.toDomain(model);
  }

  async update(id: string, data: any): Promise<Address> {
    const existing = await this.prisma.addressModel.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('ບໍ່ພົບສະຖານທີ່ນີ້ໃນລະບົບ');
    }
    const model = await this.prisma.addressModel.update({
      where: { id },
      data,
      include: {
        department: true,
        division: true,
      },
    });
    return AddressMapper.toDomain(model);
  }

  async delete(id: string): Promise<void> {
    const existing = await this.prisma.addressModel.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('ບໍ່ພົບສະຖານທີ່ນີ້ໃນລະບົບ');
    }
    await this.prisma.addressModel.delete({ where: { id } });
  }
}
