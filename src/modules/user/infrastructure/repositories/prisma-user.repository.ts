import { Injectable } from '@nestjs/common';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { PrismaService } from 'src/core/database/prisma.service';
import { User } from '../../domain/entities/user.entity';
import { UserMapper } from '../mappers/user.mapper';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(userData: any): Promise<User> {
    const model = await this.prisma.userModel.create({
      data: userData,
    });
    return UserMapper.toDomain(model);
  }
  async update(id: string, data: any): Promise<User> {
    const model = await this.prisma.userModel.update({
      where: { id },
      data,
      include: {
        branch: true,
        department: true,
        division: true,
        office: true,
        unit: true,
      },
    });
    return UserMapper.toDomain(model);
  }

  async findAll(
    skip?: number,
    take?: number,
    status?: string,
  ): Promise<{ data: User[]; total: number }> {
    const whereCondition = status ? { status: status } : {};
    const [models, total] = await this.prisma.$transaction([
      this.prisma.userModel.findMany({
        where: whereCondition,
        skip: skip,
        take: take,
        include: {
          branch: true,
          department: true,
          division: true,
          office: true,
          unit: true,
        },
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
      include: {
        branch: true,
        department: true,
        division: true,
        office: true,
        unit: true,
      },
    });
    if (!model) return null;
    return UserMapper.toDomain(model);
  }

  async findByEmpCode(empCode: string): Promise<User | null> {
    const model = await this.prisma.userModel.findUnique({
      where: { empCode },
      include: {
        branch: true,
        department: true,
        division: true,
        office: true,
        unit: true,
      },
    });
    if (!model) return null;
    return UserMapper.toDomain(model);
  }

  async findByEmail(email: string): Promise<User | null> {
    const model = await this.prisma.userModel.findUnique({
      where: { email },
      include: {
        branch: true,
        department: true,
        division: true,
        office: true,
        unit: true,
      },
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
