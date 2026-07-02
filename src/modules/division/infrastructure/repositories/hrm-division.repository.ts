import { Injectable } from '@nestjs/common';
import { IDivisionRepository } from '../../domain/repositories/division.repository.interface';
import { Division } from '../../domain/entities/division.entity';
import { DivisionMapper } from '../mappers/division.mapper';
import { PrismaService } from 'src/core/database/prisma.service';

@Injectable()
export class HrmDivisionRepository implements IDivisionRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ─── ດຶງຈາກ local DB (sync ໄວ້ຈາກ HRM ແລ້ວ) ──────────────────────────────
  async findAll(): Promise<Division[]> {
    const models = await this.prisma.divisionModel.findMany({
      orderBy: { name: 'asc' },
    });
    return models.map(DivisionMapper.toDomain);
  }

  async findByDepartment(departmentId: number): Promise<Division[]> {
    const models = await this.prisma.divisionModel.findMany({
      where: { departmentId },
      orderBy: { name: 'asc' },
    });
    return models.map(DivisionMapper.toDomain);
  }
}

