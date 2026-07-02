import { Injectable } from '@nestjs/common';
import { IDepartmentRepository } from '../../domain/repositories/department.repository.interface';
import { Department } from '../../domain/entities/department.entity';
import { DepartmentMapper } from '../mappers/department.mapper';
import { PrismaService } from 'src/core/database/prisma.service';

@Injectable()
export class HrmDepartmentRepository implements IDepartmentRepository {
  constructor(
    private readonly prisma: PrismaService,
  ) { }

  async findById(id: number): Promise<Department | null> {
    const model = await this.prisma.departmentModel.findUnique({ where: { id } });
    if (!model) return null;
    return DepartmentMapper.toDomain(model);
  }

  // ─── ດຶງຈາກ local DB (sync ໄວ້ຈາກ HRM ແລ້ວ) ──────────────────────────────
  async findAll(): Promise<Department[]> {
    const models = await this.prisma.departmentModel.findMany({
      orderBy: { name: 'asc' },
    });
    return models.map(DepartmentMapper.toDomain);
  }
}

