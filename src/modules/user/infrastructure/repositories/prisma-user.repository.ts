import { Injectable } from '@nestjs/common';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { PrismaService } from 'src/core/database/prisma.service';
import { User } from '../../domain/entities/user.entity';
import { UserMapper } from '../mappers/user.mapper';

const USER_INCLUDE = {
  department: {
    include: {
      addresses: true,
    },
  },
  office: true,
  unit: true,
  userDivisions: {
    include: {
      division: {
        include: {
          addresses: true,
        },
      },
    },
    orderBy: { isPrimary: 'desc' as const },
  },
};

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(userData: any): Promise<User> {
    const { divisionIds, ...data } = userData;
    const model = await this.prisma.userModel.create({
      data: {
        ...data,
        ...(divisionIds?.length
          ? {
              userDivisions: {
                create: divisionIds.map((id: number, index: number) => ({
                  divisionId: id,
                  isPrimary: index === 0,
                })),
              },
            }
          : {}),
      },
      include: USER_INCLUDE,
    });
    return UserMapper.toDomain(model);
  }

  async update(id: string, data: any): Promise<User> {
    const { divisionIds, addressId, ...rest } = data;

    if (divisionIds !== undefined) {
      // Replace all divisions
      await this.prisma.userDivisionModel.deleteMany({ where: { userId: id } });
      if (divisionIds.length > 0) {
        await this.prisma.userDivisionModel.createMany({
          data: divisionIds.map((divId: number, index: number) => ({
            userId: id,
            divisionId: divId,
            isPrimary: index === 0,
          })),
        });
      }
    }

    const model = await this.prisma.userModel.update({
      where: { id },
      data: rest,
      include: USER_INCLUDE,
    });
    return UserMapper.toDomain(model);
  }

  async findAll(
    skip?: number,
    take?: number,
    status?: string,
    search?: string,
  ): Promise<{ data: User[]; total: number }> {
    const whereCondition: any = status ? { status } : {};

    if (search) {
      whereCondition.OR = [
        { empCode: { contains: search, mode: 'insensitive' } },
        { firstNameLa: { contains: search, mode: 'insensitive' } },
        { lastNameLa: { contains: search, mode: 'insensitive' } },
        { firstNameEng: { contains: search, mode: 'insensitive' } },
        { lastNameEng: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [models, total] = await this.prisma.$transaction([
      this.prisma.userModel.findMany({
        where: whereCondition,
        skip: skip,
        take: take,
        include: USER_INCLUDE,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.userModel.count({ where: whereCondition }),
    ]);
    return {
      data: models.map((model) => UserMapper.toDomain(model)),
      total: total,
    };
  }

  async findById(id: string): Promise<User | null> {
    const model = await this.prisma.userModel.findUnique({
      where: { id },
      include: USER_INCLUDE,
    });
    if (!model) return null;
    return UserMapper.toDomain(model);
  }

  async findByEmpCode(empCode: string): Promise<User | null> {
    const model = await this.prisma.userModel.findUnique({
      where: { empCode },
      include: USER_INCLUDE,
    });
    if (!model) return null;
    return UserMapper.toDomain(model);
  }

  async findByEmail(email: string): Promise<User | null> {
    const model = await this.prisma.userModel.findUnique({
      where: { email },
      include: USER_INCLUDE,
    });
    if (!model) return null;
    return UserMapper.toDomain(model);
  }

  async save(user: User): Promise<void> {
    const data = UserMapper.toPersistence(user);
    await this.prisma.userModel.upsert({
      where: { id: data.id },
      update: data,
      create: data,
    });
  }
}
